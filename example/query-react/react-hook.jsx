// const {DSLink} = require('dslink/js/web');
// const {useDsaQuery} = require('dslink/js/react-hook');
const React = require('react');
const ReactDOM = require('react-dom');
const {DSLink} = require('../../js/web');
const {useDsaQuery, useDsaChildQuery} = require('../../js/react-hook');

const {useState} = React;

const ChildComponent = ({node}) => {
  // this will rerender the component on node's internal data change
  useDsaChildQuery(node);
  return <div>data out: {node.value}</div>;
};

const MainComponent = ({link}) => {
  const [node, setNode] = useState(null);
  useDsaQuery(
    link,
    '/sys',
    {
      '?configs': '*',
      'dataInPerSecond': {'?value': 'live'},
      'dataOutPerSecond': {'?value': 'live'}
    },
    (node) => {
      setNode(node.clone()); // clone the node to force a re-render
    },
    ['dataInPerSecond'] // update of these children should also trigger callback
  );
  if (!node) {
    return <div />;
  }

  return (
    <div>
      {/* dataInPerSecond will trigger parent node's query callback can be directly rendered */}
      <div>data in: {node.getChild('dataInPerSecond').value}</div>
      {/* dataOutPerSecond will not trigger parent callback after the first update, it needs to be monitored inside ChildComponent */}
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
