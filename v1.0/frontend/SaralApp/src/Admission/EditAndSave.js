import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  FlatList,
  TextInput,
} from 'react-native';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import AppTheme from '../utils/AppTheme';
import {monospace_FF} from '../utils/CommonUtils';
import Button from './commonComponents/Button';

class EditAndSave extends Component {
  constructor(props) {
    super(props);
  }

  renderItem = ({item}) => {
    console.log('item', item.value);
    return (
      <View
        style={{
          padding: 10,
        }}>
        <Text style={{fontFamily: monospace_FF, fontSize: 15}}>
          {item.label}:
        </Text>
        <TextInput
          style={{
            fontFamily: monospace_FF,
            fontWeight: 'bold',
            height: 50,
            margin: 12,
            borderWidth: 1,
            padding: 10,
            color: 'black',
            fontSize: 18,
            alignItems: 'center',
          }}
          value={item.value}
          // onChangeText={()=>}
          multiline={true}
        />
      </View>
    );
  };

  onPressConfirm = () => {
    this.props.setData(this.props.formData);
    if (this.props.pageNo == 1) this.props.navigation.goBack();
    else {
      console.log('here');
      this.props.navigation.navigate('Admissions');
    }
  };

  render() {
    console.log('...........', this.props.formData, this.props.pageNo);

    return (
      <SafeAreaView style={styles.container}>
        <FlatList
          data={this.props.formData}
          renderItem={item => this.renderItem(item)}
          keyExtractor={item => item.id}
          ListFooterComponent={() => <View />}
          ListFooterComponentStyle={{paddingBottom: 80}}
        />
        <View
          style={{
            position: 'absolute',
            top: '90%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',

            alignSelf: 'center',
          }}>
          <Button
            buttonStyle={{
              width: 150,
              backgroundColor: this.props.multiBrandingData.themeColor1
                ? this.props.multiBrandingData.themeColor1
                : AppTheme.BLUE,
            }}
            onPress={this.onPressConfirm}
            label={'CONFIRM'}
          />
          <Button
            buttonStyle={{width: 150, backgroundColor: AppTheme.ERROR_RED}}
            onPress={() => this.props.navigation.goBack()}
            label={'CANCEL'}
          />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.WHITE,
    paddingTop: 10,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
});

const mapDispatchToProps = dispatch => {
  return {
    setData: data => dispatch({type: 'SET_DATA', data}),
  };
};

const mapStateToProps = state => {
  return {
    formData: state.admissionData.formData,
    multiBrandingData: state.multiBrandingData.response.data,
    pageNo: state.admissionData.pageNo,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(EditAndSave);