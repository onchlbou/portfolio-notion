import "react-notion/src/styles.css";
import '../styles/custom.css';
import "prismjs/themes/prism-tomorrow.css";
import React from "react";

export default function App({ Component, pageProps }) {
  return (
    <div>
      <Component {...pageProps} />
    </div>
  );
}
