memopress = require('memopress');
BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
BITBOX = new BITBOXCli();

var Chart = require('chart.js');
//var myChart = new Chart();

function addData(chart, label, data) {
  // counter['memo'] = {'total_messages':0}
  // counter['blockpress'] = {'total_messages':0}
  // counter['other'] = {'total_messages':0}

    chart.data.labels.push(label);
    console.log(chart.data.datasets)
    chart.data.datasets[0].data.push(data['memo']['total_messages']);
    chart.data.datasets[1].data.push(data['blockpress']['total_messages']);
    chart.data.datasets[2].data.push(data['other']['total_messages']);
    chart.update();
};

function create_tx(){
  let message = document.getElementById('message').value;
  let txcount = document.getElementById('txcount').value;
  for(let i = 0;i<txcount; i++){
    console.log("Message: " + message);
    BITBOX.Address.utxo(cashAddress).then((result) => {
      console.log(result + cashAddress);

      // instance of transaction builder
      let transactionBuilder = new BITBOX.TransactionBuilder('bitcoincash');
      // original amount of satoshis in vin

      let originalAmount = result[0].satoshis;

      // index of vout
      let vout = result[0].vout;

      // txid of vout
      let txid = result[0].txid;

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout);


      //let message = "prefix_tests\{12/123\}";
      console.log("data: " + message);
      // let buf = BITBOX.Script.nullData.output.encode(Buffer.from(data, 'ascii'));
      data = memopress.encode('0x6d02', message);
      console.log("data: " + data);

      console.log("results: " + result);
      let data_len = data.length;
      console.log("data size:" + data_len);

      // get byte count to calculate fee. paying 1 sat/byte
      let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1 }) + data_len + 10;
      console.log("total bytes: " + byteCount);

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      let sendAmount = originalAmount - byteCount;
      console.log("sendAmount: " + sendAmount);

      // add output w/ address and amount to send
      transactionBuilder.addOutput('bitcoincash:qpy3cc67n3j9rpr8c3yx3lv0qc9k2kmfyud9e485w2', sendAmount);
      transactionBuilder.addOutput(data, 0);

      // keypair
      let keyPair = BITBOX.HDNode.toKeyPair(change);

      // sign w/ HDNode
      let redeemScript;
      transactionBuilder.sign(0, keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, originalAmount);

      // build tx
      let tx = transactionBuilder.build();
      // output rawhex
      let hex = tx.toHex();

      console.log("TX-Hex: " + hex);
      // sendRawTransaction to running BCH node
      BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => {
        console.log("Tx send:" + result);
      }, (err) => {
        console.log(err);
      });
    }, (err) => { console.log(err);
    });
  };
};

function check_seed(){
  let input = document.getElementById('seed').value;
  console.log("Input: " + input);

  document.getElementById('console').innerHTML = ""

  let mnemonic = input;
  let rootSeed = BITBOX.Mnemonic.toSeed(mnemonic);
  let masterHDNode = BITBOX.HDNode.fromSeed(rootSeed, 'bitcoincash');
  let account = BITBOX.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");
  change = BITBOX.HDNode.derivePath(account, "0/0");
  cashAddress = BITBOX.HDNode.toCashAddress(change);
  console.log(cashAddress);
  BITBOX.Address.utxo(cashAddress).then((result) => {
    let originalAmount = 0
    console.log(result + result.length);
    for(utxo in result){
      console.log("Satoshis: +" + result[utxo].satoshis);
      originalAmount += result[utxo].satoshis;
    };
    console.log(result);
    console.log("Satoshis: " + originalAmount);
    document.getElementById('console').innerHTML += "<li> CashAddress: <strong>"+ cashAddress +"</strong></li>";
    document.getElementById('console').innerHTML += "<li> Balance: <strong>"+  originalAmount +" satoshis</strong></li>";
    document.getElementById('console').innerHTML += "<li> Message: <input size='48' id='message' value='stresstest'></input><input disabled size='4' id='txcount' value='1'></input><button onclick='create_tx()'>send tx</button></li>";
  });
};

function beep(x) {
  var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
  for(var i = 0; i < x; i++){
    snd.play();
  };
};

// async function tx_listener(){
//   let messages = [];
//   let socket = new BITBOX.Socket({
//     callback: () => {
//       console.log('connected')
//     }, restURL: 'https://rest.bitcoin.com'
//   });
//   socket.listen('transactions', (message) => {
//     json = JSON.parse(message)
//     messages.push(json)
//     console.log(messages)
//   });
// };
//
// //start async tx_listerner
// tx_listener();



let socket = new BITBOX.Socket({
  callback: () => {
    console.log('connected')
  }, restURL: 'https://rest.bitcoin.com'
});

let op_returns = {};

let counter = {}
counter['memo'] = {'total_messages':0}
counter['blockpress'] = {'total_messages':0}
counter['other'] = {'total_messages':0}

let message_counter = 0;
let transaction_counter = 0;
let starttime = Math.floor(Date.now() / 1000);

socket.listen('transactions', (message) => {
  let opreturn = false;
  json = JSON.parse(message)
  let txid = json.format.txid ;
  let ts = Math.floor(Date.now() / 1000);
  html = "<li id='"+ txid +"' class='w3-bar'>";
  html += "<div class='w3-bar-item'>";
  html += "<span class='w3-large txid'><i class='fa fa-user w3-text-blue w3-large'></i> <a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + ">"+ txid +"</a></span><br>";
  html_opreturn = "<li id='"+ txid +"' class='w3-bar'>";
  html_opreturn += "<div class='w3-bar-item'>";
  for(output in json.outputs){
    let asm = json.outputs[output].scriptPubKey.asm;
    console.log("ASM:" + asm);
    let hex = json.outputs[output].scriptPubKey.hex;
    let outputclass = BITBOX.Script.classifyOutput(BITBOX.Script.fromASM(asm));

    console.log("CLASS: " + outputclass);
    html += "<span class='w3-small asm'>"+ output + ": " + asm + "</span><br>"
    if( outputclass == "nulldata") {
      opreturn = true;

      let ascii = BITBOX.Script.nullData.output.decode(Buffer.from(hex, 'hex')).toString('ascii');
    	console.log("ASCII: " + ascii);
      op_returns[txid] = {'ts':ts,'ascii':ascii,'hex':hex}
      beep(1);

      let prefix = asm.substring(10,12);
      let sub_prefix = hex.substring(4,8);

      switch (prefix) {
        case '6d':
          console.log("memo");
          ascii = ascii.substring(2);
          html += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> <i class='fa fa-star w3-text-yellow w3-small'></i> MEMO: ("+sub_prefix+") "+ ascii +"</span><br>";
          html_opreturn += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> <i class='fa fa-star w3-text-yellow w3-small'></i><a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + "> MEMO: ("+ sub_prefix +") "+ascii +"</a></span><br>";

          counter['memo']['total_messages'] += 1;
          break;
        case '8d':
          console.log("blockpress");
          ascii = ascii.substring(2);
          html += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> BLOCKPRESS: ()"+ sub_prefix +") "+ascii +"</span><br>";
          html_opreturn += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i><a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + "> BLOCKPRESS: ()"+ sub_prefix +") "+ascii +"</a></span><br>";
          counter['blockpress']['total_messages'] += 1;
          break;
        default:
        console.log("other app")
          html += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> "+ ascii +"</span><br>";
          html_opreturn += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i><a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + "> "+ ascii +"</a></span><br>";
          counter['other']['total_messages'] += 1;
      };
      addData(myChart,ts, counter);
      console.log(counter);
      // if(asm.indexOf('OP_RETURN d60') !== -1){
      //   html += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> MEMO:"+ ascii +"</span><br>";
      //   html_opreturn += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i><a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + "> MEMO:"+ ascii +"</a></span><br>";
      // }else if(asm.indexOf('OP_RETURN 8d') !== -1){
      //   html += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> BLOCKPRESS:"+ ascii +"</span><br>";
      //   html_opreturn += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i><a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + "> BLOCKPRESS:"+ ascii +"</a></span><br>";
      // }{
      //   html += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i> "+ ascii +"</span><br>";
      //   html_opreturn += "<span class='w3-small nulldata'><i class='fa fa-comment w3-text-red w3-large'></i><a target='_blank' href=https://explorer.bitcoin.com/bch/tx/" + txid + "> "+ ascii +"</a></span><br>";
      // };
      message_counter += 1;
    };
  };
  html += "</div>";
  html += "</li>";
  html_opreturn += "</div>";
  html_opreturn += "</li>";

  transaction_counter += 1;
  document.getElementById('transaction_counter').innerHTML = transaction_counter;
  document.getElementById('message_counter').innerHTML = message_counter;

  if(transaction_counter > 0){
    var now = Math.floor(Date.now() / 1000);
    let seconds = Math.floor(now - starttime);
    let transaction_rate = Math.round((transaction_counter/seconds)*100)/100;
    document.getElementById('transaction_rate').innerHTML = transaction_rate;
    document.getElementById('menu_tx_count').innerHTML =  transaction_counter;
  };
  if(message_counter > 0){
    let opreturn_percentage = Math.round(100/(transaction_counter/message_counter));
    document.getElementById('opreturn_percentage').style.width = opreturn_percentage + "%";
    document.getElementById('opreturn_percentage').innerHTML =  opreturn_percentage + "%  (OP_RETURN)";
    document.getElementById('menu_opreturn_msg_count').innerHTML =  message_counter;
  };
  document.getElementById('transaction_list').innerHTML += html // + document.getElementById('transaction_list').innerHTML;
  if( opreturn ) {
    document.getElementById('opreturn_list').innerHTML += html_opreturn //+ document.getElementById('opreturn_list').innerHTML;
  };
});
