import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {Component} from 'react';
import axios from 'axios';
import {connect} from 'react-redux';

import Button from './commonComponents/Button';
import SaralSDK from '../../SaralSDK';
import {roi} from './roi';
import AppTheme from '../utils/AppTheme';

export class Admissions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      PocRoi: null,
      disblePage1: false,
      disablePage2: true,
      disableShowData: true,
      predictionArray: [],
    };
  }

  onScan = async pageNo => {
    if (Platform.OS !== 'ios') {
      const grantedCamera = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      if (grantedCamera) {
        this.onOpenCameraActivity(pageNo);
      } else {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA).then(
          permRes => {
            if (
              permRes['android.permission.CAMERA'] ===
              PermissionsAndroid.RESULTS.GRANTED
            ) {
              this.onOpenCameraActivity(pageNo);
            }
          },
        );
      }
    }
  };

  onOpenCameraActivity = pageNo => {
    SaralSDK.startCamera(JSON.stringify(roi), pageNo.toString(), 0, true)
      .then(res => {
        let roisData = JSON.parse(res);
        let cells = roisData.layout.cells;
        this.consolidatePrediction(cells, roisData, pageNo);
      })
      .catch((code, message) => {
        console.log('code', code, message);
      });
  };

  consolidatePrediction = (cells, roisData, pageNo) => {
    var marks = '';
    for (let i = 0; i < cells.length; i++) {
      marks = '';
      let prediction = {};
      for (let j = 0; j < cells[i].rois.length; j++) {
        if (cells[i].rois[j].hasOwnProperty('result')) {
          marks = marks + cells[i].rois[j].result.prediction;
        }
      }

      if (pageNo.toString() == cells[i].page) {
        prediction = {
          label: cells[i].format.name,
          value: marks,
        };
        this.state.predictionArray.push(prediction);
      }
    }

    this.props.setData(this.state.predictionArray);
    this.props.pageNo(pageNo);

    this.props.navigation.navigate('EditAndSave');
  };

  render() {
    console.log(this.props.pageno);
    return (
      <View style={style.container}>
        <Button
          buttonStyle={{
            backgroundColor: this.props.multiBrandingData.themeColor1
              ? this.props.multiBrandingData.themeColor1
              : AppTheme.BLUE,
          }}
          disabled={this.props.pageno == 1 ? true : false}
          onPress={() => this.onScan(1)}
          label={'SCAN PAGE 1'}
        />
        <Button
          buttonStyle={{
            backgroundColor: this.props.multiBrandingData.themeColor1
              ? this.props.multiBrandingData.themeColor1
              : AppTheme.BLUE,
            marginTop: 10,
          }}
          disabled={this.props.pageno == 0 ? true : false}
          onPress={() => this.onScan(2)}
          label={'SCAN PAGE 2'}
        />
        <Button
          buttonStyle={{
            backgroundColor: '#d11a2a',
            marginTop: 50,
          }}
          onPress={() => this.props.navigation.goBack()}
          label={'CANCEL'}
        />
      </View>
    );
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppTheme.WHITE,
  },
});

const mapDispatchToProps = dispatch => {
  return {
    setData: data => dispatch({type: 'SET_DATA', data}),
    pageNo: pageNo => dispatch({type: 'PAGE_NO', pageNo}),
  };
};

const mapStateToProps = state => {
  return {
    multiBrandingData: state.multiBrandingData.response.data,
    pageno: state.admissionData.pageNo,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Admissions);