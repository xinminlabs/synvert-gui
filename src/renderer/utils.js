import { ROOT_PATH, ONLY_PATHS, SKIP_PATHS, LANGUAGE } from "./constants"

const CUSTOM = "custom";

const savePreference = (section, key, value) => {
    const preferences = window.electronAPI.getPreferences()
    preferences[section][key] = value
    window.electronAPI.setPreferences(preferences)
}

const getPreference = (section, key) => {
    const preferences = window.electronAPI.getPreferences()
    return preferences[section][key]
}

export const getLanguage = () => getPreference(CUSTOM, LANGUAGE) || "ruby";
export const saveLanguage = (language) => savePreference(CUSTOM, LANGUAGE, language);

export const getRootPath = () => getPreference(CUSTOM, ROOT_PATH) || "";
export const saveRootPath = (path) => savePreference(CUSTOM, ROOT_PATH, path);

export const getOnlyPaths = () => getPreference(CUSTOM, getRootPath() + ":" + ONLY_PATHS) || "";
export const saveOnlyPaths = (path) => savePreference(CUSTOM, getRootPath() + ":" + ONLY_PATHS, path);

export const getSkipPaths = () => getPreference(CUSTOM, getRootPath() + ":" + SKIP_PATHS) || "**/node_modules/**,**/dist/**";
export const saveSkipPaths = (path) => savePreference(CUSTOM, getRootPath() + ":" + SKIP_PATHS, path);

export const rubyEnabled = () => getPreference("ruby", "enabled").includes("yes");
export const rubyNumberOfWorkers = () => getPreference("ruby", "number_of_workers");
export const javascriptEnabled = () => getPreference("javascript", "enabled").includes("yes");
export const typescriptEnabled = () => getPreference("typescript", "enabled").includes("yes");

export const convertSnippetsToStore = (snippets) =>
    snippets.reduce(
        (obj, snippet) => ({
            ...obj,
            [snippet.id]: snippet
        }),
        {}
    );

export const sortSnippets = (snippets) =>
    snippets.sort((a, b) => {
        if (`${a.group}/${a.name}` < `${b.group}/${b.name}`) return -1
        if (`${a.group}/${a.name}` > `${b.group}/${b.name}`) return 1
        return 0
    })

export const searchSnippets = (snippets, term) =>
    snippets.filter(snippet => `${snippet.group}/${snippet.name}`.includes(term))

export const triggerEvent = (name, detail) => {
    if (detail) {
        log({ type: 'triggerEvent', name, detail })
        window.dispatchEvent(new CustomEvent(name, { detail }))
    } else {
        log({ type: 'triggerEvent', name })
        window.dispatchEvent(new Event(name))
    }
}

const snakeToCamel = (str) => str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

export const parseJSON = (str) => {
  return JSON.parse(str, function(key, value) {
    const camelCaseKey = snakeToCamel(key);

    if (this instanceof Array || camelCaseKey === key) {
      return value;
    } else {
      this[camelCaseKey] = value;
    }
  });
};

export const getNewSource = (oldSource, testResult) => {
    let newSource = oldSource;
    JSON.parse(JSON.stringify(testResult.actions)).reverse().forEach(action => {
        newSource = newSource.slice(0, action.start) + action.newCode + newSource.slice(action.end);
    });
    return newSource;
}

const LOCAL_API_SERVERS = {
    ruby: 'http://localhost:9292',
    javascript: 'http://localhost:4000',
    typescript: 'http://localhost:4000',
}

const REMOTE_API_SERVERS = {
    ruby: 'https://api-ruby.synvert.net',
    javascript: 'https://api-javascript.synvert.net',
    typescript: 'https://api-javascript.synvert.net',
}

export const baseUrl = (language) => {
    if (window.electronAPI.isDev()) {
        return LOCAL_API_SERVERS[language];
    } else {
        return REMOTE_API_SERVERS[language];
    }
}

export const log = (...args) => {
    if (window.electronAPI.isDev()) {
        console.log(...args)
    }
}
