import {
    SET_PATH,
    SET_SNIPPETS_STORE,
    SET_CURRENT_SNIPPET_ID,
    SET_LOADING,
    SET_GENERATED_SNIPPET,
    SET_SHOW_FORM,
    SET_SHOW_TEST_RESULTS,
    SET_TEST_RESULTS,
    REPLACE_TEST_RESULT,
    REMOVE_TEST_RESULT,
    REPLACE_TEST_ACTION,
    REMOVE_TEST_ACTION,
    SET_CURRENT_ACTION_INDEX,
    SET_CURRENT_RESULT_INDEX,
} from './constants'
import { getNewSource } from './utils';

export default (state = {}, action) => {
    switch (action.type) {
        case SET_PATH: {
            return {
                ...state,
                path: action.path,
            }
        }
        case SET_SNIPPETS_STORE: {
            return {
                ...state,
                snippetsStore: action.snippetsStore,
            }
        }
        case SET_CURRENT_SNIPPET_ID: {
            const snippetCode = action.currentSnippetId ? state.snippetsStore[action.currentSnippetId].source_code : "";
            return {
                ...state,
                currentSnippetId: action.currentSnippetId,
                snippetCode,
            }
        }
        case SET_GENERATED_SNIPPET: {
            return {
                ...state,
                currentSnippetId: null,
                snippetCode: action.snippetCode,
            }
        }
        case SET_LOADING: {
            return {
                ...state,
                loading: action.loading,
                loadingText: action.loadingText || "Loading...",
            }
        }
        case SET_SHOW_FORM: {
            return {
                ...state,
                showForm: action.showForm,
            }
        }
        case SET_SHOW_TEST_RESULTS: {
            return {
                ...state,
                showTestResults: action.showTestResults,
            }
        }
        case SET_TEST_RESULTS: {
            return {
                ...state,
                testResults: action.testResults,
                currentResultIndex: 0,
                currentActionIndex: 0,
            }
        }
        case REPLACE_TEST_RESULT: {
            const testResults = state.testResults;
            const testResult = testResults[action.resultIndex];
            const absolutePath = window.electronAPI.pathJoin(action.rootPath, testResult.filePath);
            let source = window.electronAPI.readFile(absolutePath, "utf-8");
            const newSource = getNewSource(source, testResult);
            window.electronAPI.writeFile(absolutePath, newSource);
            testResults.splice(action.resultIndex, 1);
            return {
                ...state,
                testResults,
            }
        }
        case REMOVE_TEST_RESULT: {
            const testResults = state.testResults;
            testResults.splice(action.resultIndex, 1);
            return {
                ...state,
                testResults,
            }
        }
        case REPLACE_TEST_ACTION: {
            const testResults = state.testResults;
            const testResult = testResults[action.resultIndex];
            const actions = testResult.actions;
            const resultAction = actions[action.actionIndex];
            const absolutePath = window.electronAPI.pathJoin(action.rootPath, testResult.filePath);
            let source = window.electronAPI.readFile(absolutePath, "utf-8");
            source = source.slice(0, resultAction.start) + resultAction.newCode + source.slice(resultAction.end);
            window.electronAPI.writeFile(absolutePath, source);
            const offset = resultAction.newCode.length - (resultAction.end - resultAction.start);
            actions.splice(action.actionIndex, 1)
            if (actions.length > 0) {
                actions.slice(action.actionIndex).forEach(action => {
                    action.start = action.start + offset;
                    action.end = action.end + offset;
                });
                testResult.fileSource = source;
            } else {
                testResults.splice(action.resultIndex, 1);
            }
            return {
                ...state,
                testResults,
            }
        }
        case REMOVE_TEST_ACTION: {
            const testResults = state.testResults;
            testResults[action.resultIndex].actions.splice(action.actionIndex, 1);
            return {
                ...state,
                testResults,
            }
        }
        case SET_CURRENT_RESULT_INDEX: {
            return {
                ...state,
                currentResultIndex: action.resultIndex,
                currentActionIndex: null,
            }
        }
        case SET_CURRENT_ACTION_INDEX: {
            return {
                ...state,
                currentResultIndex: action.resultIndex,
                currentActionIndex: action.actionIndex,
            }
        }
        default:
            return state
    }
}