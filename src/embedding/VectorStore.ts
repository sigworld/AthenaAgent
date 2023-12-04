import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { readFileContent, writeToFile } from "../skill/FileIO";
import { fetchLLMEmbedding } from "../skill/LLMInference";
import { selectTopKMMRWithCosine, selectTopKWithCosine } from "../util/embedding";
import { logOf } from "../util/logger";
import { has, mergeLeft, notNilEmpty, prop } from "../util/puref";

const logger = logOf("VectorStore");

/**
 * multi-file based embedding vector store
 */
export class LocalFileVectorStore {
  data: Record<string, EmbeddingDocument> = {};

  persist(filePath: string) {
    const written = writeToFile(filePath, JSON.stringify(this.data), "overwrite");
    if (written) {
      logger.info("vector store %s persisted", filePath);
    } else {
      logger.error("vector store %s failed to persist", filePath);
    }
  }

  findDocument(id: string): EmbeddingDocument {
    return prop(id, this.data);
  }

  addDocument(id: string, document: EmbeddingDocument) {
    if (has(id, this.data)) {
      logger.warn("a document with the same id %s already exists, will not overwrite", id);
    } else {
      this.data[id] = document;
    }
  }

  /**
   * load embedding store into memory
   */
  static fromFile(filePath: string): LocalFileVectorStore {
    const rawContent = readFileContent(filePath);
    const data = JSON.parse(rawContent) as Record<string, EmbeddingDocument>;
    const store = new LocalFileVectorStore();
    for (const [key, value] of Object.entries(data)) {
      store.addDocument(key, value);
    }
    return store;
  }
}

export const buildKnowledgeBaseDocument = async (
  title: string,
  texts: string[],
  metadata: Record<string, unknown>
): Promise<KnowledgeBaseDocument> => {
  const document: EmbeddingDocument = { title, metadata, createtime: Date.now() };
  const hashes = texts.map((str) => bytesToHex(sha256(str)));
  const vectorsOfTexts = await fetchLLMEmbedding(texts);
  const augmentedIndexes = [];
  for (let i = 0; i < vectorsOfTexts.length; i++) {
    const vector = vectorsOfTexts[i];
    // surrounding context (index): last one, next one
    const next = i < vectorsOfTexts.length - 1 ? [i + 1] : [];
    const prev = i > 0 ? [i - 1] : [];
    const similar = selectTopKMMRWithCosine(vector, vectorsOfTexts, 4, 0.6)
      .map(([_, index]) => index)
      .filter((idx) => idx != i);
    augmentedIndexes.push({ next, prev, similar });
  }
  document.embeddings = {
    vectors: vectorsOfTexts,
    hashes,
    texts,
    indexes: augmentedIndexes
  };
  return new KnowledgeBaseDocument(document);
};

export class KnowledgeBaseDocument {
  _document: EmbeddingDocument;
  constructor(document: EmbeddingDocument) {
    this._document = document;
  }

  getDocument() {
    return this._document;
  }

  private _embeddingVectors() {
    return this._document.embeddings?.vectors;
  }

  private _embeddingTexts(indexes: number[]) {
    return indexes.map((i) => this._document.embeddings?.texts[i]);
  }

  private _augmentedTexts(indexes: number[]) {
    const texts = this._document.embeddings?.texts;
    return indexes.map((i) => ({
      next: (this._document.embeddings?.indexes[i].next || []).map((ni) => texts[ni]),
      prev: (this._document.embeddings?.indexes[i].prev || []).map((pi) => texts[pi]),
      similar: (this._document.embeddings?.indexes[i].similar || []).map((si) => {
        const similarNext = (this._document.embeddings?.indexes[si].next || [])
          .map((sni) => texts[sni])
          .join(" ");
        const similarPrev = (this._document.embeddings?.indexes[si].prev || [])
          .map((pni) => texts[pni])
          .join(" ");
        return [similarPrev, texts[si], similarNext].join(" ");
      }) // surround prev and next for similar
    }));
  }

  async query(
    queries: string[],
    topK: number,
    augmented: boolean = false
  ): Promise<AugmentedEmbeddingText[]> {
    const embeddingVectors = this._embeddingVectors();
    const queryResult: AugmentedEmbeddingText[] = [];
    if (notNilEmpty(embeddingVectors)) {
      // get a embedding based on query vector, select top k
      const queryVectors = await fetchLLMEmbedding(queries);
      for (const queryVector of queryVectors) {
        const results = selectTopKWithCosine(queryVector, embeddingVectors, topK);
        const indexes = results.map(([index]) => index);
        const embeddingTexts = this._embeddingTexts(indexes);
        const augmentedTexts = augmented ? this._augmentedTexts(indexes) : [];
        for (let i = 0; i < embeddingTexts.length; i++) {
          const res: AugmentedEmbeddingText = {
            text: embeddingTexts[i]
          };
          if (augmented) {
            queryResult.push(mergeLeft({ augmentedTexts: augmentedTexts[i] }, res));
          } else {
            queryResult.push(res);
          }
        }
      }
    }
    return queryResult;
  }
}
