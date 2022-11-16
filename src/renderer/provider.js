import React, { useReducer } from 'react'

import appReducer from './reducer'
import AppContext from './context'
import { getWorkingDir } from './utils'

const initialState = {
    path: getWorkingDir() || '',
    snippetsStore: {},
    currentSnippetId: null,
    generatedSnippet: '',
    loading: false,
    loadingText: 'Loading...',
    showForm: true,
}

export default ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState)

    return (
        <AppContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AppContext.Provider>
    )
}