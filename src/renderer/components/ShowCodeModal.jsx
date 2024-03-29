import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default ({ snippet, language, close }) => {
  return (
    <>
      <div className="modal fade show" data-backdrop="static" style={{ display: "block" }}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {snippet.group}/{snippet.name}
              </h5>
              <button type="button" className="close" onClick={close}>
                <span>&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <SyntaxHighlighter language={language} style={tomorrow}>
                {snippet.source_code}
              </SyntaxHighlighter>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={close}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};
