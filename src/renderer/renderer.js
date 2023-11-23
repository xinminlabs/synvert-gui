/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import "./app.jsx";
import "./index.css";

import React from "react";
import toast from "react-hot-toast";
import { compareVersions } from "compare-versions";
import { parseJSON, formatCommandResult, runSynvertRuby, runSynvertJavascript } from "synvert-ui-common";

import {
  EVENT_TEST_SNIPPET,
  EVENT_SNIPPET_TESTED,
  EVENT_RUN_SNIPPET,
  EVENT_SNIPPET_RUN,
  EVENT_CHECK_DEPENDENCIES,
  EVENT_UPDATE_DEPENDENCIES,
  EVENT_DEPENDENCIES_UPDATED,
} from "./constants";
import {
  rubyNumberOfWorkers,
  log,
  triggerEvent,
  rubyEnabled,
  javascriptEnabled,
  baseUrlByLanguage,
  typescriptEnabled,
  getInited,
  javascriptMaxFileSize,
  typescriptMaxFileSize,
  rubySingleQuote,
  rubyTabWidth,
  javascriptSemi,
  javascriptSingleQuote,
  javascriptTabWidth,
  typescriptSingleQuote,
  typescriptSemi,
  typescriptTabWidth,
  isAddFileAction,
} from "./utils";

const runCommand = async (command, args, { input } = {}) => {
  try {
    log({ type: "runCommand", command: [command].concat(args).join(" ") });
    const { stdout, stderr } = await window.electronAPI.runShellCommand(command, args, input);
    log({ type: "runCommand", stdout, stderr });
    return formatCommandResult({ stdout, stderr });
  } catch (e) {
    log({ type: "runCommand error", e });
    return { error: e.message };
  }
};

const installGem = async (name) => {
  const { error } = await runCommand("gem", ["install", name]);
  if (error) {
    toast.error(`Failed to install the ${name} gem. ` + error);
  } else {
    toast.success(`Successfully installed the ${name} gem.`);
  }
};

const installNpm = async (name) => {
  const { error } = await runCommand("npm", ["install", "-g", name]);
  if (error) {
    toast.error(`Failed to install the ${name} npm. ` + error);
  } else {
    toast.success(`Successfully installed the ${name} npm.`);
  }
};

const showErrorMesage = (message, buttonTitle, buttonAction) => {
  toast(
    (t) => (
      <div>
        <p>{message}</p>
        <div className="d-flex justify-content-between">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              buttonAction();
              toast.dismiss(t.id);
            }}
          >
            {buttonTitle}
          </button>
          <button className="btn btn-info btn-sm" onClick={() => toast.dismiss(t.id)}>
            Dismiss
          </button>
        </div>
      </div>
    ),
    { duration: Infinity },
  );
};

const VERSION_REGEXP = /(\d+\.\d+\.\d+) \(with synvert-core (\d+\.\d+\.\d+)/;

const checkRubyDependencies = async () => {
  if (!rubyEnabled()) {
    return;
  }
  let { output, error } = await runCommand("ruby", ["--version"]);
  if (error) {
    toast.error("ruby is not available!");
    return;
  }
  ({ output, error } = await runCommand("synvert-ruby", ["--version"]));
  if (error) {
    showErrorMesage("Synvert gem not found. Run `gem install synvert`.", "Install Now", () => installGem("synvert"));
    return;
  } else {
    const result = output.match(VERSION_REGEXP);
    const localSynvertVersion = result[1];
    const localSynvertCoreVersion = result[2];
    const response = await fetch(baseUrlByLanguage("ruby") + "/check-versions");
    const json = await response.json();
    const remoteSynvertVersion = json["synvert_version"];
    const remoteSynvertCoreVersion = json["synvert_core_version"];
    log({ ruby: { remoteSynvertVersion, remoteSynvertCoreVersion } });
    if (compareVersions(remoteSynvertVersion, localSynvertVersion) === 1) {
      showErrorMesage(
        `synvert gem version ${remoteSynvertVersion} is available. (Current version: ${localSynvertVersion})`,
        "Update Now",
        () => installGem("synvert"),
      );
    }
    if (compareVersions(remoteSynvertCoreVersion, localSynvertCoreVersion) === 1) {
      showErrorMesage(
        `synvert-core gem version ${remoteSynvertCoreVersion} is available. (Current Version: ${localSynvertCoreVersion})`,
        "Update Now",
        () => installGem("synvert-core"),
      );
    }
  }
};

const checkJavascriptDependencies = async () => {
  if (!javascriptEnabled() && !typescriptEnabled()) {
    return;
  }
  let { output, error } = await runCommand("node", ["--version"]);
  if (error) {
    toast.error("nodejs is not available!");
    return;
  }
  ({ output, error } = await runCommand("synvert-javascript", ["--version"]));
  if (error) {
    showErrorMesage("Synvert npm not found. Run `npm install -g synvert`.", "Install Now", () => installNpm("synvert"));
    return;
  } else {
    // Install synvert-core globally doesn't make any sense
    const result = output.match(VERSION_REGEXP);
    const localSynvertVersion = result[1];
    // const localSynvertCoreVersion = result[2];
    const response = await fetch(baseUrlByLanguage("javascript") + "/check-versions");
    const json = await response.json();
    const remoteSynvertVersion = json["synvert_version"];
    log({ javascript: { remoteSynvertVersion } });
    // const remoteSynvertCoreVersion = json['synvert_core_version'];
    if (compareVersions(remoteSynvertVersion, localSynvertVersion) === 1) {
      showErrorMesage(
        `synvert npm version ${remoteSynvertVersion} is available. (Current version: ${localSynvertVersion})`,
        "Update Now",
        () => installNpm("synvert"),
      );
    }
    // if (compareVersions(remoteSynvertCoreVersion, localSynvertCoreVersion) === 1) {
    //   showErrorMesage(`synvert-core npm version ${remoteSynvertCoreVersion} is available. (Current Version: ${localSynvertCoreVersion})`, "Update Now", () => installNpm("synvert-core"));
    // }
  }
};

const checkDependencies = async () => {
  try {
    await checkRubyDependencies();
    await checkJavascriptDependencies();
  } catch (error) {
    log({ error });
  }
};

const addFileSourceToTestResults = (testResults, rootPath) => {
  testResults.forEach((testResult) => {
    if (!isAddFileAction(testResult)) {
      const fileSource = window.electronAPI.readFile(window.electronAPI.pathJoin(rootPath, testResult.filePath));
      testResult.fileSource = fileSource;
    }
    testResult.rootPath = rootPath;
  });
};

const testRubySnippet = async (event) => {
  if (!rubyEnabled()) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error: "Synvert ruby is not enabled!" });
    return;
  }
  const { detail: { snippetCode, rootPath, onlyPaths, skipPaths } } = event;
  const additionalCommandArgs = buildRubyAdditionalCommandArgs();
  const { output, error } = await runSynvertRuby(runCommand, "test", rootPath, onlyPaths, skipPaths, additionalCommandArgs, snippetCode);
  if (error) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error });
    return;
  }
  try {
    const testResults = parseJSON(output);
    addFileSourceToTestResults(testResults, rootPath);
    triggerEvent(EVENT_SNIPPET_TESTED, { testResults });
  } catch (e) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error: e.message });
  }
};

const testJavascriptSnippet = async (event) => {
  if (!javascriptEnabled()) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error: "Synvert javascript is not enabled!" });
    return;
  }
  const { detail: { snippetCode, rootPath, onlyPaths, skipPaths } } = event;
  const additionalCommandArgs = buildJavascriptAdditionalCommandArgs();
  const { output, error } = await runSynvertJavascript(runCommand, "test", rootPath, onlyPaths, skipPaths, additionalCommandArgs, snippetCode);
  if (error) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error });
    return;
  }
  try {
    const testResults = parseJSON(output);
    addFileSourceToTestResults(testResults, rootPath);
    triggerEvent(EVENT_SNIPPET_TESTED, { testResults });
  } catch (e) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error: e.message });
  }
};

const testTypescriptSnippet = async (event) => {
  if (!typescriptEnabled()) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error: "Synvert typescript is not enabled!" });
    return;
  }
  const { detail: { snippetCode, rootPath, onlyPaths, skipPaths } } = event;
  const additionalCommandArgs = buildTypescriptAdditionalCommandArgs();
  const { output, error } = await runSynvertJavascript(runCommand, "test", rootPath, onlyPaths, skipPaths, additionalCommandArgs, snippetCode);
  if (error) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error });
    return;
  }
  try {
    const testResults = parseJSON(output);
    addFileSourceToTestResults(testResults, rootPath);
    triggerEvent(EVENT_SNIPPET_TESTED, { testResults });
  } catch (e) {
    triggerEvent(EVENT_SNIPPET_TESTED, { error: e.message });
  }
};

const testSnippet = async (event) => {
  const {
    detail: { language },
  } = event;
  switch (language) {
    case "ruby":
      return await testRubySnippet(event);
    case "javascript":
      return await testJavascriptSnippet(event);
    case "typescript":
      return await testTypescriptSnippet(event);
  }
};

const runRubySnippet = async (event) => {
  if (!rubyEnabled()) {
    triggerEvent(EVENT_SNIPPET_RUN, { error: "Synvert ruby is not enabled!" });
    return;
  }
  const { detail: { snippetCode, rootPath, onlyPaths, skipPaths } } = event;
  const additionalCommandArgs = buildRubyAdditionalCommandArgs();
  const { output, error } = await runSynvertRuby(runCommand, "run", rootPath, onlyPaths, skipPaths, additionalCommandArgs, snippetCode);
  if (error) {
    triggerEvent(EVENT_SNIPPET_RUN, { error });
    return;
  }
  try {
    triggerEvent(EVENT_SNIPPET_RUN, { affectedFiles: JSON.parse(output).affected_files });
  } catch (e) {
    triggerEvent(EVENT_SNIPPET_RUN, { error: e.message });
  }
};

const runJavascriptSnippet = async (event) => {
  if (!javascriptEnabled()) {
    triggerEvent(EVENT_SNIPPET_RUN, { error: "Synvert javascript is not enabled!" });
    return;
  }
  const { detail: { snippetCode, rootPath, onlyPaths, skipPaths } } = event;
  const additionalCommandArgs = buildJavascriptAdditionalCommandArgs();
  const { output, error } = await runSynvertJavascript(runCommand, "run", rootPath, onlyPaths, skipPaths, additionalCommandArgs, snippetCode);
  if (error) {
    triggerEvent(EVENT_SNIPPET_RUN, { error });
    return;
  }
  try {
    triggerEvent(EVENT_SNIPPET_RUN, { affectedFiles: JSON.parse(output).affected_files });
  } catch (e) {
    triggerEvent(EVENT_SNIPPET_RUN, { error: e.message });
  }
};

const runTypescriptSnippet = async (event) => {
  if (!typescriptEnabled()) {
    triggerEvent(EVENT_SNIPPET_RUN, { error: "Synvert typescript is not enabled!" });
    return;
  }
  const { detail: { snippetCode, rootPath, onlyPaths, skipPaths } } = event;
  const additionalCommandArgs = buildTypescriptAdditionalCommandArgs();
  const { output, error } = await runSynvertJavascript(runCommand, "run", rootPath, onlyPaths, skipPaths, additionalCommandArgs, snippetCode);
  if (error) {
    triggerEvent(EVENT_SNIPPET_RUN, { error });
    return;
  }
  try {
    triggerEvent(EVENT_SNIPPET_RUN, { affectedFiles: JSON.parse(output).affected_files });
  } catch (e) {
    triggerEvent(EVENT_SNIPPET_RUN, { error: e.message });
  }
};

const runSnippet = async (event) => {
  const {
    detail: { language },
  } = event;
  switch (language) {
    case "ruby":
      return await runRubySnippet(event);
    case "javascript":
      return await runJavascriptSnippet(event);
    case "typescript":
      return await runTypescriptSnippet(event);
  }
};

const updateRubyDependencies = async () => {
  const { error } = await runCommand("gem", [
    "install",
    "synvert",
    "synvert-core",
    "node_query",
    "node_mutation",
    "parser_node_ext",
    "syntax_tree_ext",
  ]);
  if (error) {
    return { error };
  }
  const result = await runCommand("synvert-ruby", ["--sync"]);
  return { error: result.error };
};

const updateJavascriptDependencies = async () => {
  const { error } = await runCommand("npm", ["install", "-g", "synvert"]);
  if (error) {
    return { error };
  }
  const result = await runCommand("synvert-javascript", ["--sync"]);
  return { error: result.error };
};

const updateDependencies = async (event) => {
  const {
    detail: { language },
  } = event;
  let result;
  if (language === "ruby") {
    result = await updateRubyDependencies();
  } else {
    result = await updateJavascriptDependencies();
  }
  if (result.error) {
    toast.error(`Failed to update ${language} dependencies: ${result.error}`);
  } else {
    toast.success(`Successfully updated ${language} dependencies.`);
  }
  triggerEvent(EVENT_DEPENDENCIES_UPDATED, { error: result.error });
};

function buildRubyAdditionalCommandArgs() {
  const additionalCommandArgs = ["--number-of-workers", rubyNumberOfWorkers(), "--tab-width", rubyTabWidth()];
  if (!rubySingleQuote()) {
    additionalCommandArgs.push("--double-quote");
  }
  return additionalCommandArgs;
}

function buildJavascriptAdditionalCommandArgs() {
  const additionalCommandArgs = ["--max-file-size", javascriptMaxFileSize() * 1024, "--tab-width", javascriptTabWidth()];
  if (javascriptSingleQuote()) {
    additionalCommandArgs.push("--single-quote");
  }
  if (!javascriptSemi()) {
    additionalCommandArgs.push("--no-semi");
  }
  return additionalCommandArgs;
}

function buildTypescriptAdditionalCommandArgs() {
  const additionalCommandArgs = ["--max-file-size", typescriptMaxFileSize() * 1024, "--tab-width", typescriptTabWidth()];
  if (typescriptSingleQuote()) {
    additionalCommandArgs.push("--single-quote");
  }
  if (!typescriptSemi()) {
    additionalCommandArgs.push("--no-semi");
  }
  return additionalCommandArgs;
}

window.addEventListener(EVENT_TEST_SNIPPET, testSnippet);
window.addEventListener(EVENT_RUN_SNIPPET, runSnippet);
window.addEventListener(EVENT_UPDATE_DEPENDENCIES, updateDependencies);
// check dependencies after first inited.
window.addEventListener(EVENT_CHECK_DEPENDENCIES, checkDependencies);

if (getInited()) {
  // check dependencies every time app starts
  setTimeout(checkDependencies, 100);
}
