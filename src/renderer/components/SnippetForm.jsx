import React, { useContext, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import useEventListener from "@use-it/event-listener";
import {
  composeGeneratedSnippets,
  filePatternByLanguage,
  parsersByLanguage,
  placeholderByLanguage,
} from "synvert-ui-common";

import AppContext from "../context";
import { SET_LOADING, SET_GENERATED_SNIPPETS, EVENT_SNIPPET_RUN, EVENT_SNIPPET_TESTED } from "../constants";
import SnippetCode from "./SnippetCode";
import { baseUrlByLanguage } from "../utils";

export default () => {
  const [errorMessage, setErrorMessage] = useState("");
  const { language, dispatch } = useContext(AppContext);
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { inputs_outputs: [{ input: "", output: "" }], nql_or_rules: "nql" } });
  const { fields, append, remove, replace } = useFieldArray({ control, name: "inputs_outputs" });

  useEffect(() => {
    setValue("filePattern", filePatternByLanguage(language));
    setValue("rubyVersion", "");
    setValue("nodeVersion", "");
    setValue("gemVersion", "");
    setValue("npmVersion", "");
    replace([{ input: "", output: "" }]);
    setErrorMessage("");
  }, [language]);

  useEventListener(EVENT_SNIPPET_TESTED, ({ detail: { error } = {} }) => {
    setErrorMessage(error);
  });

  useEventListener(EVENT_SNIPPET_RUN, ({ detail: { error } = {} }) => {
    setErrorMessage(error);
  });

  const addMore = () => append({ input: "", output: "" });

  const removeLast = () => {
    if (fields.length > 1) {
      remove(fields.length - 1);
    }
  };

  const updateGeneratedSnippets = ({ generatedSnippets, snippetError }) => {
    dispatch({
      type: SET_GENERATED_SNIPPETS,
      generatedSnippets,
      snippetError,
    });
  };

  const genereateSnippetRequestBody = (language, inputs, outputs, parser, nql_or_rules) => {
    return JSON.stringify({
      language,
      inputs,
      outputs,
      parser,
      nql_or_rules,
    });
  };

  const onSubmit = async (data) => {
    dispatch({ type: SET_LOADING, loading: true, loadingText: "Submitting..." });
    const { inputs_outputs, nql_or_rules } = data;
    const inputs = inputs_outputs.map((input_output) => input_output.input);
    const outputs = inputs_outputs.map((input_output) => input_output.output);
    const url = `${baseUrlByLanguage(language)}/generate-snippet`;
    const method = "POST";
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-SYNVERT-TOKEN": window.electronAPI.getToken(),
      "X-SYNVERT-PLATFORM": "gui",
    };
    updateGeneratedSnippets({ generatedSnippets: [], snippetError: "" });
    try {
      const responses = await Promise.all(
        parsersByLanguage(language).map((parser) =>
          fetch(url, {
            method,
            headers,
            body: genereateSnippetRequestBody(language, inputs, outputs, parser, nql_or_rules),
          })
        )
      );
      const data = await Promise.all(responses.map((response) => response.json()));
      if (data.find((response) => response.error)) {
        updateGeneratedSnippets({ generatedSnippets: [], snippetError: data.find((response) => response.error).error });
      } else if (data.every((response) => response.snippets.length === 0)) {
        updateGeneratedSnippets({ generatedSnippets: [], snippetError: "Failed to generate snippet" });
      } else {
        const generatedSnippets = parsersByLanguage(language).flatMap((parser, index) => {
          const snippets = data[index].snippets;
          if (snippets.length === 0) {
            return [];
          }
          return composeGeneratedSnippets(
            language === "ruby"
              ? {
                  language,
                  filePattern: data.filePattern,
                  rubyVersion: data.rubyVersion,
                  gemVersion: data.gemVersion,
                  snippets,
                  parser,
                }
              : {
                  language,
                  filePattern: data.filePattern,
                  nodeVersion: data.nodeVersion,
                  npmVersion: data.npmVersion,
                  snippets,
                  parser,
                }
          );
        });
        updateGeneratedSnippets({ generatedSnippets, snippetError: "" });
      }
    } catch (e) {
      console.log(e);
      updateGeneratedSnippets({
        generatedSnippets: [],
        snippetError: "Failed to send request, please check your network setting.",
      });
    }
    dispatch({ type: SET_LOADING, loading: false });
  };

  return (
    <div className="snippet-form">
      <div className="new-snippet container-fluid flex-grow-1">
        <h4 className="text-center">Generate Snippet</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>File Pattern:</label>
            <input
              className={`form-control ${errors.filePattern && "is-invalid"}`}
              defaultValue={filePatternByLanguage(language)}
              {...register("filePattern", { required: true })}
            />
            {errors.filePattern && <div className="invalid-feedback">required</div>}
          </div>
          {language === "ruby" ? (
            <div className="form-group">
              <label>Minimum Ruby Version:</label>
              <input
                className={`form-control ${errors.rubyVersion && "is-invalid"}`}
                placeholder="e.g. 2.4.5"
                {...register("rubyVersion", { pattern: /\d\.\d\.\d/ })}
              />
              {errors.rubyVersion && <div className="invalid-feedback">format is incorrect</div>}
            </div>
          ) : (
            <div className="form-group">
              <label>Minimum Node Version:</label>
              <input
                className={`form-control ${errors.rubyVersion && "is-invalid"}`}
                placeholder="e.g. 14.0.0"
                {...register("nodeVersion", { pattern: /\d\.\d\.\d/ })}
              />
              {errors.nodeVersion && <div className="invalid-feedback">format is incorrect</div>}
            </div>
          )}
          {language === "ruby" ? (
            <div className="form-group">
              <label>Gem Version:</label>
              <input
                className={`form-control ${errors.gemVersion && "is-invalid"}`}
                placeholder="e.g. rails ~> 5.0.0"
                {...register("gemVersion", { pattern: /\w+\ / })}
              />
              {errors.gemVersion && <div className="invalid-feedback">format is incorrect</div>}
            </div>
          ) : (
            <div className="form-group">
              <label>Npm Version:</label>
              <input
                className={`form-control ${errors.npmVersion && "is-invalid"}`}
                placeholder="e.g. express ^4.0.0"
                {...register("npmVersion", { pattern: /\w+\ / })}
              />
              {errors.gemVersion && <div className="invalid-feedback">format is incorrect</div>}
            </div>
          )}
          <div className="form-row">
            <div className="col-md-6">
              <label>Inputs</label>
            </div>
            <div className="col-md-6">
              <a href="https://synvert.net/how_to_write_inputs_outputs" className="float-right" target="_blank">
                How to write inputs/outpus?
              </a>
              <label>Outputs</label>
            </div>
          </div>
          {fields.map((item, index) => (
            <div className="form-row" key={item.id}>
              <div className="form-group col-md-6">
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder={placeholderByLanguage(language)["input"]}
                  {...register(`inputs_outputs.${index}.input`)}
                ></textarea>
              </div>
              <div className="form-group col-md-6">
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder={placeholderByLanguage(language)["output"]}
                  {...register(`inputs_outputs.${index}.output`)}
                ></textarea>
              </div>
            </div>
          ))}
          <div className="form-group d-flex justify-content-between">
            <div>
              <button type="button" className="btn btn-link" onClick={addMore}>
                Add More Input/Output
              </button>
              {fields.length > 1 && (
                <button type="button" className="btn btn-link" onClick={removeLast}>
                  Remove Last Input/Output
                </button>
              )}
            </div>
            <div className="nql-or-rules-select">
              <label htmlFor="nql">
                <input {...register("nql_or_rules")} id="nql" type="radio" value="nql" />
                NQL
              </label>
              <label htmlFor="rules">
                <input {...register("nql_or_rules")} id="rules" type="radio" value="rules" />
                Rules
              </label>
              <input className="btn btn-primary" type="submit" value="Generate Snippet" />
            </div>
          </div>
          {errorMessage && <div className="text-danger">{errorMessage}</div>}
          <SnippetCode rows={10} />
        </form>
      </div>
    </div>
  );
};
