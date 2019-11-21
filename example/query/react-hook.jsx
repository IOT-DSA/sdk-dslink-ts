// const {DSLink} = require('dslink/js/web');
// const {useDsaQuery} = require('dslink/js/react-hook');
const React = require('react');
const ReactDOM = require('react-dom');
const {DSLink} = require('../../js/web');
const {useDsaQuery, useDsaQueryNode} = require('../../js/react-hook');

const {useState} = React;

const ChildComponent = ({node}) => {
  const [nodeState, setNode] = useState(node);
  useDsaQueryNode(node, (node) => {
    setNode(node.clone()); // clone the node to make sure state changes
  });
  return <div>data out: {nodeState.value}</div>;
};

const MainComponent = ({link}) => {
  const [node, setNode] = useState(null);
  useDsaQuery(
    link,
    '/sys',
    {
      '?configs': '*',
      '?useChildren': ['dataInPerSecond'],
      'dataInPerSecond': {'?value': 'live'},
      'dataOutPerSecond': {'?value': 'live'},
      '*': {'?value': 'snapshot', '?filter': {'field': '$type', '=': 'number'}} // for all the other nodes we just need a snapshot value
    },
    (node) => {
      setNode(node.clone()); // clone the node to make sure state changes
    }
  );
  if (!node) {
    return <div />;
  }
  // dataInPerSecond is updated with the '?useChildren' directly, so it also triggers the callback of parent node
  // dataOutPerSecond is monitored inside ChildComponent
  return (
    <div>
      <div>data in: {node.getChild('dataInPerSecond').value}</div>
      <ChildComponent node={node.getChild('dataOutPerSecond')} />
    </div>
  );
};

async function main() {
  let link = new DSLink('ws://localhost:8080/ws', 'json');
  link.connect();

  ReactDOM.render(<MainComponent link={link} />, document.querySelector('#app'));
}

main();
