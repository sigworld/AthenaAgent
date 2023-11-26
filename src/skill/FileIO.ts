import fs from "fs";
import { logOf } from "../util/logger";
import { isNilEmpty } from "../util/puref";

const logger = logOf("Skill-FileIO");

const _FILETYPE_REGEX = new RegExp(/\.([a-zA-Z0-9]*)$/, "s");
const _DEFAULT_FILE_ENCODING = "utf-8";

const getFileType = (filePath: string): FileIOSupportedFileTypes => {
  const matchArr = _FILETYPE_REGEX.exec(filePath);
  if (isNilEmpty(matchArr)) return "TEXT";

  switch (matchArr[1].toUpperCase()) {
    case "PDF": {
      throw new Error("pdf parsing not supported yet");
    }

    case "DOC":
    case "DOCX": {
      throw new Error("word document parsing not supported yet");
    }

    case "CVS": {
      throw new Error("cvs document parsing not supported yet");
    }
    case "XLS":
    case "XLSX": {
      throw new Error("excel/cvs document parsing not supported yet");
    }

    case "PPT":
    case "PPTX": {
      throw new Error("slides parsing not supported yet");
    }

    case "TXT":
      return "TEXT";
    default:
      throw new Error(`unknown file type ${matchArr[1]} not supported yet`);
  }
};

export const readFileContent = (filePath: string): string | undefined => {
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    logger.warn("[read] target file %s not exists", filePath);
    return;
  }
  try {
    switch (getFileType(filePath)) {
      case "TEXT": {
        const fileContent = fs.readFileSync(filePath, {
          encoding: _DEFAULT_FILE_ENCODING,
          flag: "r"
        });
        return fileContent;
      }
      default: {
        logger.warn("unsupported file %s", filePath);
      }
    }
  } catch (error) {
    logger.error("failed to read file %s: %s", filePath, error);
  }
  return;
};

export const writeToFile = (
  filePath: string,
  content: string,
  mode: FileIOFileWriteMode = "overwrite"
): boolean => {
  try {
    switch (mode) {
      case "overwrite": {
        fs.writeFileSync(filePath, content, {
          encoding: _DEFAULT_FILE_ENCODING
        });
        return true;
      }
      case "append": {
        const fileExists = fs.existsSync(filePath);
        if (!fileExists) {
          logger.warn("[append] target file %s not exists", filePath);
          return false;
        }
        fs.appendFileSync(filePath, content, {
          encoding: _DEFAULT_FILE_ENCODING
        });
        return true;
      }
    }
  } catch (error) {
    logger.error("failed to %s file %s: %s", mode, filePath, error);
  }
  return false;
};
