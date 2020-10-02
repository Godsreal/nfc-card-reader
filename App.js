import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    SafeAreaView,
    StyleSheet,
    TextInput,
    Alert
} from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

class App extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            log: "Ready...",
            text: ""
        }
    }
    componentDidMount() {
        NfcManager.start();
    }

    componentWillUnmount() {
        this._cleanUp();
    }

    _cleanUp = () => {
        NfcManager.cancelTechnologyRequest().catch(() => 0);
    }

    readData = async () => {
        try {
            this._cleanUp();
            this.setState({
                log: 'ready...'
            })
            console.log('read data called');
            let tech = Platform.OS === 'ios' ? NfcTech.MifareIOS : NfcTech.NfcA;
            let done = await NfcManager.requestTechnology(tech, {
                alertMessage: 'Ready to do some custom Mifare cmd!'
            });
	          let tag = await NfcManager.getTag();
            console.warn(tag);
            if (done) console.log('done setting up');
            let cmd = Platform.OS === 'ios' ? NfcManager.sendMifareCommandIOS : NfcManager.transceive;
            let visaAid = [0xA0,0x00,0x00,0x00,0x03,0x10,0x10,0x00]
            let mastercardAid = [0xA0,0x00,0x00,0x00,0x04,0x10,0x10]
            //A0 00 00 00 04 10 10
            let aidResp = await cmd([0x00,0xA4,0x04,0x00,0x07,...mastercardAid]);
            let hexAidResp= this._changeToHex(aidResp)
            console.log('aidResp is',hexAidResp);

            //============get processing option==================//
            //80 A8 00 00 04 83 02 55 41
            let gpoCommand = [0x80,0xA8,0x00,0x00,0x02,0x83,0x00,0x00]
            if(aidResp){
              var gpoResp = await cmd([...gpoCommand]);
              var hexGpoResp= this._changeToHex(gpoResp);
              console.log('gpoResp is',hexGpoResp);
            }


            //==================get card data=============================//
            // 00 B2 01 0C 00 or
            let dataCommand = [0x00,0xB2,0x01,0x0C,0x00]//record 1 sf1  note:sf2 will be 10
            //records and sfs to read
            //sf2 record 2 and 3
            //sf2 7
            //sf2 8 9
            if(gpoResp){
              var dataResp = await cmd([...dataCommand]);
              console.log('dataResp is',dataResp)
              var hexDataResp = this._changeToHex(dataResp);
              console.log('hexDataResp is',hexDataResp);
            }
            var text;
            console.log('text is',text);
            this.setState({
                log: text
            })

            this._cleanUp();
        } catch (ex) {
            this.setState({
                log: ex.toString()
            })
            this._cleanUp();
        }
    }


    onChangeText = (text) => {
        this.setState({
            text
        })
    }

    _changeToHex = (arr) => {
      let bytes=[...arr];
      for(let i=0; i<bytes.length; i++){
          bytes[i]= bytes[i].toString(16);
      }
      return bytes;
    }

    render() {
        return (
            <SafeAreaView style={styles.container}>

                <TouchableOpacity
                    style={styles.buttonRead}
                    onPress={this.readData}>
                    <Text style={styles.buttonText}>Read</Text>
                </TouchableOpacity>

                <View style={styles.log}>
                    <Text>{this.state.log}</Text>
                </View>
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    textInput: {
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 10,
        height: 50,
        textAlign: 'center',
        color: 'black'
    },
    buttonWrite: {
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#9D2235'
    },
    buttonRead: {
        marginLeft: 20,
        marginRight: 20,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#006C5B'
    },
    buttonText: {
        color: '#ffffff'
    },
    log: {
        marginTop: 30,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    }
})

export default App;
