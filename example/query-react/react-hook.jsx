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
  let node = useDsaQuery(link, '/', {
    sys: {
      '?configs': '*',
      '*': {'?value': 'live', '?filter': {'field': '$type', '!=': null}}
    }
  }, null, 3000);
  if (!node) {
    return <div />;
  }

  let sysNode = node.getChild('sys');

  return (
    <div>
      <div>data in: {sysNode.getChild('dataInPerSecond').value}</div>
      <div>data in: {sysNode.getChild('dataOutPerSecond').value}</div>
    </div>
  );
};

async function main() {
  let link = new DSLink('ws://localhost:8080/ws', 'json');
  link.connect();

  ReactDOM.render(<MainComponent link={link} />, document.querySelector('#app'));
}

main();
