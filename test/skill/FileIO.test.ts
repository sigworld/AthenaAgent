import { expect, test } from "vitest";
import { readFileContent, writeToFile } from "../../src/skill/FileIO";

test("read file", () => {
  expect(readFileContent("./test/sample/file.txt")).toBe(`hello
world
athena agent`);
});

test("write file", () => {
  const content = `a new file
of athena agent
"llm"`;
  const filePath = "./test/sample/wfile.txt";
  expect(writeToFile(filePath, content)).toBeTruthy();
  expect(readFileContent(filePath)).toEqual(content);
});

test("append file", () => {
  const content = `a new file
of athena agent
"llm"`;
  const filePath = "./test/sample/wfile.txt";
  expect(writeToFile(filePath, content)).toBeTruthy();
  expect(writeToFile(filePath, content, "append")).toBeTruthy();
  expect(readFileContent(filePath)).toEqual(`${content}${content}`);
});
