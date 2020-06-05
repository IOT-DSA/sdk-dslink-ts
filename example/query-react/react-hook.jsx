// const {DSLink} = require('dslink/js/web');
// const {useDsaQuery} = require('dslink/js/react-hook');
const React = require('react');
const ReactDOM = require('react-dom');
const {DSLink} = require('../../js/web');
const {useDsaQuery, useDsaChildQuery} = require('../../js/react-hook');

const {useState} = React;

const ChildComponent = ({node}) => {
  // this will rerender the component on node's internal data change
  return <div>data out: {node.value}</div>;
};
const MainComponent = ({link}) => {
  const [nodeObj, setNodeObj] = useState(null);
  useDsaQuery(
    link,
    '/',
    {
      sys: {
        '?configs': '*',
        '?actions': '*',
        '*': {},
      },
    },
    (update, json) => {
      setNodeObj(json);
    },
    3000
  );
  if (!nodeObj) {
    return <div />;
  }

  let sysNode = nodeObj['sys'];

  return (
    <div>
      <div>data in: {sysNode['dataInPerSecond']}</div>
      <div>data in: {sysNode['dataOutPerSecond']}</div>
    </div>
  );
};

async function main() {
  let link = new DSLink('ws://localhost:8080/ws', 'json');
  link.connect();

  ReactDOM.render(<MainComponent link={link} />, document.querySelector('#app'));
}

main();
