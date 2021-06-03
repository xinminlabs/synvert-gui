import { SET_PATH, SET_SNIPPETS_STORE, SET_CURRENT_SNIPPET_ID } from './constants'

export default (state = {}, action) => {
    switch (action.type) {
        case SET_PATH:
            return {
                ...state,
                path: action.path,
            }
        case SET_SNIPPETS_STORE:
            return {
                ...state,
                snippetsStore: action.snippetsStore,
            }
        case SET_CURRENT_SNIPPET_ID:
            return {
                ...state,
                currentSnippetId: action.currentSnippetId,
            }
        default:
            return state
    }
}