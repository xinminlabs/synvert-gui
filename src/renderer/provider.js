import React, { useReducer } from 'react'

import appReducer from './reducer'
import AppContext from './context'
import { getOnlyPaths, getRootPath, getSkipPaths } from './utils'

const initialState = {
    rootPath: getRootPath(),
    onlyPaths: getOnlyPaths(),
    skipPaths: getSkipPaths(),
    snippetsStore: {},
    currentSnippetId: null,
    snippetCode: '',
    snippetError: "",
    loading: false,
    loadingText: 'Loading...',
    showForm: true,
    showTestResults: false,
    testResults: [],
}

export default ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState)

    return (
        <AppContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AppContext.Provider>
    )
}