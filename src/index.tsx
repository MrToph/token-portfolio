import React from 'react';
import ReactDOM from 'react-dom';
import App from 'modules/root/components/App';
import customTheme from 'modules/root/theme';

console.log(`%c${process.env.REACT_APP_NAME}@${process.env.REACT_APP_VERSION}`,  `color: ${customTheme.colors.teal[`200`]}; font-size: 12px;`)

ReactDOM.render(<App />, document.getElementById('root'));
