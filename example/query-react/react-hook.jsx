// const {DSLink} = require('dslink/js/web');
// const {useDsaQuery} = require('dslink/js/react-hook');
const React = require('react');
const ReactDOM = require('react-dom');
const {DSLink} = require('../../js/web');
const {useDsaQuery, useDsaConnectionStatus} = require('../../js/react-hook');

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
      downstream: {
        '?configs': '*',
        '?actions': '*',
        '?children': 'live',
        '*': {'?configs': '*'},
      },
      sys:{
        '?actions': '*',
      }
    },
    (update, json) => {
      setNodeObj(json);
    },
    3000
  );
  let connectStatus = useDsaConnectionStatus(link, true);
  console.log(connectStatus);

  if (!nodeObj) {
    return <div />;
  }

  let node1 = nodeObj['downstream'];
  let node2 = nodeObj['sys'];
  console.log(node1, node2);
  return (
    <div>
      downstream:
      <pre>{JSON.stringify(node1, null, 1)}</pre>
      sys:
      <pre>{JSON.stringify(node2, null, 1)}</pre>
    </div>
  );
};

async function main() {
  let link = new DSLink('ws://localhost:8080/ws', 'json');
  link.connect();

  ReactDOM.render(<MainComponent link={link} />, document.querySelector('#app'));
}

main();
