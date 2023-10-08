import React, {Component} from 'react';
import {View, ScrollView, Text, BackHandler, Alert,Platform,PermissionsAndroid,FlatList} from 'react-native';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import _ from 'lodash';
import DateTimePicker from '@react-native-community/datetimepicker';
import Strings from '../../utils/Strings';
import AppTheme from '../../utils/AppTheme';
import Spinner from '../common/components/loadingIndicator';
import DropDownMenu from '../common/components/DropDownComponent';
import ButtonComponent from '../common/components/ButtonComponent';
import {
  getLoginData,
  setStudentsExamData,
  getStudentsExamData,
  getLoginCred,
  setLoginData,
} from '../../utils/StorageUtils';
import {OcrLocalResponseAction} from '../../flux/actions/apis/OcrLocalResponseAction';
import {GetStudentsAndExamData} from '../../flux/actions/apis/getStudentsAndExamData';
import { GetOptions } from '../../flux/actions/apis/getOptions';
import {FilteredDataAction} from '../../flux/actions/apis/filteredDataActions';
import APITransport from '../../flux/actions/transport/apitransport';
import {
  checkNetworkConnectivity,
  dispatchCustomModalMessage,
  dispatchCustomModalStatus,
  monospace_FF,
  SCAN_TYPES,
  validateToken,
} from '../../utils/CommonUtils';
import {ROIAction} from '../StudentsList/ROIAction';
import {GetAbsentStudentData} from '../../flux/actions/apis/getAbsentStudentData';
import {LoginAction} from '../../flux/actions/apis/LoginAction';
import {LogoutAction} from '../../flux/actions/apis/LogoutAction';
import axios from 'axios';
import SaralSDK from '../../../SaralSDK';

//components
import ShareComponent from '../common/components/Share';
import MultibrandLabels from '../common/components/multibrandlabels';
import ModalView from '../common/components/ModalView';
import CustomPopup from '../common/components/CustomPopup';
import {
  getRegularStudentExamApi,
  setRegularStudentExamApi,
} from '../../utils/offlineStorageUtils';
import constants from '../../flux/actions/constants';
import {storeFactory} from '../../flux/store/store';
import DeviceInfo from 'react-native-device-info';
import {SchoolDetailSubmit} from '../../utils/Analytics';

class SelectRoiLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      loginDetails: null,
      defaultSelected: Strings.select_text,
      classesArr: [],
      optionList: [],
      classListIndex: -1,
      selectedClass: '',
      sectionList: [],
      sectionListIndex: -1,
      setIndex: 0,
      selectedSection: '',
      pickerDate: new Date(),
      selectedDate: '',
      subArr: [],
      examTestID: [],
      subIndex: -1,
      selectedSubject: '',
      selectSet: '',
      setArr: [],
      errClass: '',
      errSub: '',
      errSet: '',
      errDate: '',
      errSection: '',
      selectedClassId: '',
      calledStudentsData: false,
      calledOptions: false,
      sectionValid: false,
      username: '',
      password: '',
      dataPayload: null,
      calledLogin: false,
      callApi: '',
      dateVisible: false,
      scanType: SCAN_TYPES.PAT_TYPE,
      examDate: [],
      calledAbsentStatus: false,
      absentStatusPayload: null,
      subjectsData: [],
      filterdataid: [],
      isHidden: false,
      isCalledStudentAndExam: false,
      set: [],
      ExamSetArray: [],
      disabled: false,
      predictionJson: {}
    }
  }

  onPress() {
    this.setState({isHidden: !this.state.isHidden});
  }

  processDataOptions(data) {
    this.setState({
      optionList: []
    })
    data.data.sort((a, b) => {
        return a.layout_name - b.layout_name;
      });

    let sortedArrOp = [];
    data.data.forEach(op => {
      sortedArrOp.push(op.layout_name)
    });
    this.setState({
      optionList: sortedArrOp
    })
  }

  getOptions = async (api) => {
    var obj = this;
    if (api.method === 'GET') {
      let apiResponse = null;
      const source = axios.CancelToken.source();
      const id = setTimeout(() => {
        if (apiResponse === null) {
          source.cancel('The request timed out.');
        }
      }, 60000);
      axios
        .get(api.apiEndPoint(), {
          headers: api.getHeaders(),
          cancelToken: source.token,
        })
        .then(function (res) {
          apiResponse = res;
          clearTimeout(id);
          api.processResponse(res);
          obj.processDataOptions(res);
        })
        .catch(function (err) {
          console.log('error', err);
        });
    }
  };

  getRoi = async (api) => {
    var obj = this;
    if (api.method === 'GET') {
      let apiResponse = null;
      const source = axios.CancelToken.source();
      const id = setTimeout(() => {
        if (apiResponse === null) {
          source.cancel('The request timed out.');
        }
      }, 60000);
      axios
        .get(api.apiEndPoint(), {
          headers: api.getHeaders(),
          cancelToken: source.token,
        })
        .then(function (res) {
          apiResponse = res;
          clearTimeout(id);
          api.processResponse(res);
          obj.onSubmitClick(res);
        })
        .catch(function (err) {
          console.log('error', err);
        });
    }
  };

  componentDidMount() {
    const {navigation, scanTypeData} = this.props;
    navigation.addListener('willFocus', async payload => {
    let loginDetails = await getLoginData();
        let apiObj = new GetOptions({}, loginDetails.token);
        this.getOptions(apiObj);
    })
      }

  loader = flag => {
    this.setState({
      isLoading: flag,
    });
  };

  onDropDownSelect = async (index, value, type) => {
    let loginDetails = await getLoginData();
    let apiObj = new ROIAction({layout_name: value}, loginDetails.token);
    console.log('apiObj>>>>>>>', apiObj)
    //this.props.APITransport(apiObj);
    this.getRoi(apiObj);
  };

  loginAgain = async () => {
    let loginCred = await getLoginCred();
    if (loginCred) {
      this.setState(
        {
          isLoading: true,
          username: loginCred.schoolId,
          password: loginCred.password,
        },
        () => {
          this.callLogin();
        },
      );
    } else {
      this.callCustomModal(
        Strings.message_text,
        Strings.please_try_again,
        true,
        this.loginAgain,
        true,
      );
    }
  };

  callLogin = () => {
    this.setState(
      {
        isLoading: true,
        calledLogin: true,
      },
      () => {
        let loginObj = {
          schoolId: this.state.username,
          password: this.state.password,
        };
        let apiObj = new LoginAction(loginObj);
        this.props.APITransport(apiObj);
      },
    );
  };

  callAbsentStatus = (payload, token) => {
    this.setState(
      {
        isLoading: true,
        calledAbsentStatus: true,
      },
      () => {
        let apiObj = new GetAbsentStudentData(payload, token);
        this.props.APITransport(apiObj);
      },
    );
  };

  validateScanStatusApi = () => {
    const {selectedClassId, selectedExam, selectedSection} = this.state;
    const {loginDetails} = this.props;
    let schoolId = loginDetails.schoolInfo.schoolCode;
    let payload = {
      schoolId: schoolId,
      standardId: selectedClassId,
      section: selectedSection == 'All' ? 0 : selectedSection,
      examCode: selectedExam,
    };

    this.setState(
      {
        scanStatusPayload: payload,
      },
      () => {
        let isTokenValid = validateToken(loginDetails.expiresOn);

        if (isTokenValid) {
          this.callScanStatus(payload, loginDetails.jwtToken);
        } else if (!isTokenValid) {
          this.setState({
            callApi: 'callScanStatus',
          });
          this.loginAgain();
        }
      },
    );
  };

  callScanStatus = (payload, token) => {
    this.setState(
      {
        isLoading: true,
        calledScanStaus: true,
      },
      () => {
        let apiObj = new GetScanStatusAction(payload, token);
        this.props.APITransport(apiObj);
      },
    );
  };

  renderItem = ({ item }) => (
    <View>
      <Text>{item.name}</Text>
    </View>
  );

  onSubmitClick = async (roi) => {
    
      console.log('calling camera action>>>>>>>>')
      if (Platform.OS !== 'ios') {

          PermissionsAndroid.requestMultiple(
            [
              PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
              PermissionsAndroid.PERMISSIONS.CAMERA,
            ],
            {
              title: Strings.permission_text,
              message: Strings.app_needs_permission,
            },
          ).then(permRes => {
            if (
              permRes['android.permission.READ_EXTERNAL_STORAGE'] ===
                PermissionsAndroid.RESULTS.GRANTED &&
              permRes['android.permission.WRITE_EXTERNAL_STORAGE'] ===
                PermissionsAndroid.RESULTS.GRANTED &&
              permRes['android.permission.CAMERA'] ===
                PermissionsAndroid.RESULTS.GRANTED
            ) {
                this.openCameraActivity(roi);
              }
          });
        }
  };

  openCameraActivity = async (roiData) => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'SaralSDK Demo App Camera Permission',
          message:
            'SaralSDK Demo application require camera to perform scanning operation ',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        this.setState({
          activityOpen: true,
        });
        let totalPages =
          roiData.data.layout.hasOwnProperty('pages') &&
          roiData.data.layout.pages;
        let pageNumber = totalPages || totalPages > 0 ? '1' : null;
        let jsonRoiData = roiData.data;
        let hasTimer = this.props.loginData.data.school.hasOwnProperty(
          'scanTimeoutMs',
        )
          ? this.props.loginData.data.school.scanTimeoutMs
          : 0;
        let isManualEditEnabled =
          this.props.loginData.data.school.hasOwnProperty('isManualEditEnabled')
            ? this.props.loginData.data.school.isManualEditEnabled
            : false;
        SaralSDK.startCamera(
          JSON.stringify(jsonRoiData),
          pageNumber,
          hasTimer,
          isManualEditEnabled,
        )
          .then(res => {
            let roisData = JSON.parse(res);
            let cells = roisData.layout.cells;
            this.consolidatePrediction(cells, roisData);
          })
          .catch((code, message) => {
            console.log('code', code, message);
          });
      } else {
      }
    } catch (err) {}
  };


  consolidatePrediction(cells, roisData) {
    var pridictedJsontemp = {};
    var predictionConfidenceArray = [];
    for (let i = 0; i < cells.length; i++) {
      let marks = '';
      predictionConfidenceArray = [];
      for (let j = 0; j < cells[i].rois.length; j++) {
        if (cells[i].rois[j].hasOwnProperty('result')) {
          marks = marks + cells[i].rois[j].result.prediction;
          predictionConfidenceArray.push(cells[i].rois[j].result.confidence);
          // roisData.layout.cells[i].predictionConfidence = cells[i].rois[j].result.confidence
        }
      }
      pridictedJsontemp[roisData.layout.cells[i].format.name] = marks;
    }

    this.setState({
      predictionJson: pridictedJsontemp
    })
    
  }

  async callExamAndStudentData(token) {
    const deviceUniqId = await DeviceInfo.getUniqueId();
    let hasNetwork = await checkNetworkConnectivity();
    let hasCacheData = await getRegularStudentExamApi();
    // let cacheFilterData =
    //   hasCacheData != null
    //     ? hasCacheData.filter(element => {
    //         let conditionSwitch =
    //           element.key == this.props.loginData.data.school.schoolId &&
    //           element.class == this.state.selectedClass &&
    //           element.section == this.state.selectedSection &&
    //           element.subject == this.state.selectedSubject;
    //         if (conditionSwitch) {
    //           return true;
    //         }
    //       })
    //     : [];

    // if (hasCacheData && cacheFilterData.length > 0) {
    //   console.log('INSIDEIF>>>>>>>>>>>>>>>>>>');
    //   this.setState({isCalledStudentAndExam: true, isLoading: false});
    //   storeFactory.dispatch(
    //     this.dispatchStudentExamData(cacheFilterData[0].data),
    //   );
    // } else
    if (hasNetwork) {
      let dataPayload = {
        classId: this.state.selectedClassId,
        section: this.state.selectedSection,
        subject: this.state.selectedSubject,
      };
      let apiObj = new GetStudentsAndExamData(dataPayload, token, deviceUniqId);
      this.props.APITransport(apiObj);
      this.setState({
        isLoading: false,
        isCalledStudentAndExam: true,
      });
    } else {
      this.setState({isLoading: false});
      this.callCustomModal(
        Strings.message_text,
        Strings.you_dont_have_cache,
        false,
      );
    }
  }

  render() {
    const {
      isLoading,
      defaultSelected,
      optionList,
      classListIndex,
      selectedClass,
      sectionList,
      setIndex,
      ExamSetArray,
      sectionListIndex,
      selectedSection,
      pickerDate,
      subArr,
      selectedSubject,
      selectSet,
      subIndex,
      errClass,
      errSub,
      errSet,
      errSection,
      sectionValid,
      dateVisible,
      disabled,
      predictionJson
    } = this.state;
    const {loginData, multiBrandingData, modalStatus, modalMessage} =
      this.props;
    const BrandLabel =
      multiBrandingData &&
      multiBrandingData.screenLabels &&
      multiBrandingData.screenLabels.selectDetails[0];
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: multiBrandingData
            ? multiBrandingData.themeColor2
            : AppTheme.WHITE_OPACITY,
        }}>
        <ScrollView
          contentContainerStyle={{paddingTop: '5%', paddingBottom: '35%'}}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps={'handled'}>
          <View>
            { Object.entries(predictionJson).length == 0 ? (
            <View style={styles.container1}>
              <Text style={styles.header1TextStyle}>
                {Strings.please_select_below_details}
              </Text>
              <View
                style={{
                  backgroundColor: 'white',
                  paddingHorizontal: '5%',
                  minWidth: '100%',
                  paddingVertical: '10%',
                  borderRadius: 4,
                }}>
                <View
                  style={[
                    styles.fieldContainerStyle,
                    {paddingBottom: classListIndex != -1 ? 0 : '10%'},
                  ]}>
                  <View style={{flexDirection: 'row'}}>
                    <Text style={[styles.labelTextStyle]}>
                      {'Select Layout'}
                    </Text>
                  </View>
                  <DropDownMenu
                    options={optionList}
                    onSelect={(idx, value) =>
                      this.onDropDownSelect(idx, value, 'option')
                    }
                    defaultData={defaultSelected}
                    defaultIndex={classListIndex}
                    selectedData={selectedClass}
                    icon={require('../../assets/images/arrow_down.png')}
                  />
                </View>
              </View>
            </View> ) : (
            <View>
              {Object.entries(predictionJson).map(([key, value]) => (
              <View key={key}>
                <Text style={{ backgroundColor: AppTheme.GREY_WHITE, borderRadius: 10,
    padding: 20,
    margin: 10,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 5}}>{key}: {value}</Text>
              </View>
              ))}
            </View>)
            }
          </View>
        </ScrollView>
        
      </View>
    );
  }
}

const styles = {
  container1: {
    flex: 1,
    marginHorizontal: '6%',
    alignItems: 'center',
  },
  btnContainer: {
    paddingVertical: '15%',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  header1TextStyle: {
    lineHeight: 40,
    borderRadius: 4,
    borderColor: AppTheme.LIGHT_GREY,
    width: '100%',
    textAlign: 'center',
    fontSize: AppTheme.FONT_SIZE_LARGE,
    fontWeight: 'bold',
    color: AppTheme.BLACK,
    letterSpacing: 1,
    marginBottom: '5%',
    fontFamily: monospace_FF,
  },
  fieldContainerStyle: {
    paddingVertical: '2.5%',
  },
  labelTextStyle: {
    width: '40%',
    fontSize: AppTheme.FONT_SIZE_MEDIUM,
    color: AppTheme.BLACK,
    fontWeight: 'bold',
    letterSpacing: 1,
    lineHeight: 35,
    fontFamily: monospace_FF,
  },
  nxtBtnStyle: {
    width: 160,
    height: 43,
  },
  imageViewContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    // justifyContent:'center'
  },
  imageContainerStyle: {
    padding: 5,
    marginRight: 10,
    height: 50,
    width: 50,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: AppTheme.TAB_BORDER,
    justifyContent: 'center',
    backgroundColor: AppTheme.TAB_BORDER,
  },
};

const mapStateToProps = state => {
  return {
    ocrLocalResponse: state.ocrLocalResponse,
    loginData: state.loginData,
    studentsAndExamData: state.studentsAndExamData,
    options: state.options,
    scanTypeData: state.scanTypeData.response,
    apiStatus: state.apiStatus,
    roiData: state.roiData,
    optionsData: state.optionsData,
    absentStudentDataResponse: state.absentStudentDataResponse,
    getScanStatusData: state.getScanStatusData,
    multiBrandingData: state.multiBrandingData.response.data,
    bgFlag: state.bgFlag,
    modalStatus: state.modalStatus,
    modalMessage: state.modalMessage,
  };
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      APITransport: APITransport,
      OcrLocalResponseAction: OcrLocalResponseAction,
      FilteredDataAction: FilteredDataAction,
      LogoutAction: LogoutAction,
      dispatchCustomModalStatus: dispatchCustomModalStatus,
      dispatchCustomModalMessage: dispatchCustomModalMessage,
    },
    dispatch,
  );
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SelectRoiLayout);