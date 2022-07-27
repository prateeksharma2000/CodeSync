import React, { useEffect, useRef, useState } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../Actions";

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const [output, setOutput] = useState("");
  const [compiling, setCompiling] = useState(false);
  let code;
  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "dracula",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );

      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        code = instance.getValue();
        onCodeChange(code);
        if (origin !== "setValue") {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });
    }
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCompiling(true);
    const reqBody = {
      clientId: process.env.REACT_APP_CLIENT_ID,
      clientSecret: process.env.REACT_APP_CLIENT_SECRET,
      script: editorRef.current.getValue(),
      language: "cpp14",
      versionIndex: "2",
    };
    try {
      const response = await fetch(
        console.log(process.env.REACT_APP_BACKEND_URL);
        `/compile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        }
      );
      const data = await response.json();
      const output = data.output;
      socketRef.current.emit(ACTIONS.OUTPUT, {
        roomId,
        output,
      });
    } catch (error) {
      console.log(error);
    }
    setCompiling(false);
  };

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
      socketRef.current.on(ACTIONS.OUTPUT, ({ output }) => {
        setOutput(output);
      });
    }

    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
      socketRef.current.off(ACTIONS.OUTPUT);
    };
  }, [socketRef.current]);

  return (
    <>
      <textarea id="realtimeEditor"></textarea>
      {compiling === false ? (
        <button
          type="submit"
          id="submitBtn"
          className="btn"
          onClick={handleSubmit}
        >
          Compile
        </button>
      ) : (
        <button type="submit" id="submitBtn" className="btn">
          Compiling...
        </button>
      )}
      <div className="output">{output}</div>
    </>
  );
};

export default Editor;
