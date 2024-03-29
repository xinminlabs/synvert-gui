import React, { useContext, useEffect, useState } from "react";

import AppContext from "../context";
import ChevronRightSvg from "./svgs/chevron-right.svg";
import ChevronDownSvg from "./svgs/chevron-down.svg";
import ReplaceSvg from "./svgs/replace.svg";
import ReplaceAllSvg from "./svgs/replace-all.svg";
import CloseSvg from "./svgs/close.svg";
import {
  SET_SHOW_TEST_RESULTS,
  REMOVE_TEST_ACTION,
  REMOVE_TEST_RESULT,
  REPLACE_TEST_ACTION,
  REPLACE_TEST_RESULT,
  SET_CURRENT_RESULT_INDEX,
  SET_CURRENT_ACTION_INDEX,
} from "../constants";
import SnippetCode from "./SnippetCode";
import FilesToInclude from "./FilesToInclude";
import FilesToExclude from "./FilesToExclude";
import SearchButton from "./SearchButton";
import ReplaceAllButton from "./ReplaceAllButton";

const showDiff = (result, action) => {
  switch (action.type) {
    case "add_file":
      return (
        <>
          <span className="old-code"></span>
          <span className="new-code">{action.newCode}</span>
        </>
      );
    case "remove_file":
      return (
        <>
          <span className="old-code">{result.fileSource}</span>
          <span className="new-code"></span>
        </>
      );
    case "group":
      return (
        <>
          {action.actions.map((childAction, actionIndex) => (
            <div key={actionIndex}>
              <span className="old-code">{result.fileSource.substring(childAction.start, childAction.end)}</span>
              <span className="new-code">{childAction.newCode}</span>
            </div>
          ))}
        </>
      );
    default:
      return (
        <>
          <span className="old-code">{result.fileSource.substring(action.start, action.end)}</span>
          <span className="new-code">{action.newCode}</span>
        </>
      );
  }
};

const TestResults = () => {
  const { rootPath, testResults, currentResultIndex, currentActionIndex, dispatch } = useContext(AppContext);

  const [filesCollapse, setFilesCollapse] = useState({});

  useEffect(() => {
    if (testResults.length === 0) {
      dispatch({ type: SET_SHOW_TEST_RESULTS, showTestResults: false });
    }
  }, [testResults]);

  const toggleResult = (filePath) => {
    setFilesCollapse({
      ...filesCollapse,
      ...{ [filePath]: !filesCollapse[filePath] },
    });
  };

  const back = () => {
    dispatch({ type: SET_SHOW_TEST_RESULTS, showTestResults: false });
  };

  const replaceResult = (resultIndex) => {
    dispatch({ type: REPLACE_TEST_RESULT, testResults, resultIndex, rootPath });
  };

  const removeResult = (resultIndex) => {
    dispatch({ type: REMOVE_TEST_RESULT, testResults, resultIndex });
  };

  const replaceAction = (resultIndex, actionIndex) => {
    dispatch({ type: REPLACE_TEST_ACTION, testResults, resultIndex, actionIndex, rootPath });
  };

  const removeAction = (resultIndex, actionIndex) => {
    dispatch({ type: REMOVE_TEST_ACTION, testResults, resultIndex, actionIndex });
  };

  const resultClicked = (resultIndex) => {
    dispatch({ type: SET_CURRENT_RESULT_INDEX, resultIndex });
  };

  const actionClicked = (resultIndex, actionIndex, actionStart, actionEnd) => {
    dispatch({ type: SET_CURRENT_ACTION_INDEX, resultIndex, actionIndex, actionStart, actionEnd });
  };

  return (
    <div className="search-results">
      <button className="btn btn-sm btn-back" onClick={back}>
        &lt;&nbsp;Back
      </button>
      <div className="ml-3 mr-3">
        <SnippetCode rows={5} />
        <FilesToInclude />
        <FilesToExclude />
        <div className="d-flex justify-content-end">
          <SearchButton />
          <ReplaceAllButton />
        </div>
      </div>
      <ul className="mt-3">
        {testResults.map((result, resultIndex) => (
          <li key={resultIndex}>
            <div
              className={resultIndex === currentResultIndex && currentActionIndex === null ? "result active" : "result"}
              onClick={() => resultClicked(resultIndex)}
            >
              <a href="#" className="toggle-icon" onClick={() => toggleResult(result.filePath)}>
                {filesCollapse[result.filePath] ? <ChevronRightSvg /> : <ChevronDownSvg />}
              </a>
              {result.actions[0].type === "add_file" && (
                <span className="new-file" title={`Add ${result.filePath}`}>
                  + {result.filePath}
                </span>
              )}
              {result.actions[0].type === "remove_file" && (
                <span className="old-file" title={`Remove ${result.filePath}`}>
                  - {result.filePath}
                </span>
              )}
              {result.actions[0].type === "rename_file" && (
                <>
                  <span className="old-file" title={`Rename ${result.filePath} to ${result.newFilePath}`}>
                    - {result.filePath}
                  </span>
                  <br />
                  <span className="new-file" title={`Rename ${result.filePath} to ${result.newFilePath}`}>
                    + {result.newFilePath}
                  </span>
                </>
              )}
              {!["add_file", "remove_file", "rename_file"].includes(result.actions[0].type) && (
                <span title={result.filePath}>{result.filePath}</span>
              )}
              <div className="toolkit">
                <a href="#" onClick={() => replaceResult(resultIndex)}>
                  <ReplaceAllSvg />
                </a>
                <a href="#" onClick={() => removeResult(resultIndex)}>
                  <CloseSvg />
                </a>
              </div>
            </div>
            {!filesCollapse[result.filePath] && (
              <ul className="search-actions">
                {!["add_file", "remove_file"].includes(result.actions[0].type) &&
                  result.actions.map((action, actionIndex) => (
                    <li key={actionIndex}>
                      <div
                        className={
                          resultIndex === currentResultIndex && actionIndex === currentActionIndex
                            ? "action active"
                            : "action"
                        }
                        onClick={() => actionClicked(resultIndex, actionIndex, action.start, action.end)}
                      >
                        {result.actions[0].type !== "rename_file" && (
                          <div className="toolkit">
                            {typeof action.newCode !== "undefined" && (
                              <a href="#" onClick={() => replaceAction(resultIndex, actionIndex)}>
                                <ReplaceSvg />
                              </a>
                            )}
                            <a href="#" onClick={() => removeAction(resultIndex, actionIndex)}>
                              <CloseSvg />
                            </a>
                          </div>
                        )}
                        {showDiff(result, action)}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TestResults;
