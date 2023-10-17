/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, useEffect, useReducer } from "react";
import { Form as FormB, Button, Card } from "react-bootstrap";
import { Form, Field } from "react-final-form";
import arrayMutators from "final-form-arrays";
import moment from "moment-timezone";
import { getAllTimeZoneList } from "../../../utils/XAUtils";
import DatasetPolicyItemComp from "./DatasetPolicyItemComp";
import { fetchApi } from "Utils/fetchAPI";
import { maxBy, find } from "lodash";
import userGreyIcon from "../../../images/user-grey.svg";
import groupGreyIcon from "../../../images/group-grey.svg";
import roleGreyIcon from "../../../images/role-grey.svg";
import AsyncCreatableSelect from "react-select/async-creatable";
import PolicyValidityPeriodComp from "../../PolicyListing/PolicyValidityPeriodComp";
import PolicyConditionsComp from "../../PolicyListing/PolicyConditionsComp";
import { isEqual, isEmpty, isObject } from "lodash";
import { policyConditionUpdatedJSON } from "Utils/XAUtils";
import { Loader } from "Components/CommonComponents";
import dateFormat from "dateformat";

const initialState = {
  loader: true,
  serviceDetails: null,
  serviceCompDetails: null,
  policyData: null,
  formData: {}
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...state,
        loader: false,
        serviceDetails: action.serviceDetails,
        serviceCompDetails: action.serviceCompDetails,
        policyData: action?.policyData,
        formData: action.formData
      };
    default:
      throw new Error();
  }
}

function AccessGrantForm({ dataset, onDataChange }) {
  const [policyState, dispatch] = useReducer(reducer, initialState);
  const { loader, serviceCompDetails, policyData, formData } = policyState;
  const [showModal, policyConditionState] = useState(false);
  const [validityPeriod, setValidityPeriod] = useState([]);

  useEffect(() => {
    fetchInitalData();
  }, []);

  const fetchInitalData = async () => {
    let policyData = null;
    if (dataset.name) {
      policyData = await fetchPolicyData();
    }
    if (policyData != null) {
      setValidityPeriod(policyData.validitySchedules);
      let serviceData = await fetchServiceDetails(policyData.service);
      let serviceCompData = await getServiceDefData(policyData.serviceType);
      dispatch({
        type: "SET_DATA",
        serviceDetails: serviceData,
        serviceCompDetails: serviceCompData,
        policyData: policyData || null,
        formData: generateFormData(policyData, serviceCompData)
      });
    }
  };

  const fetchPolicyData = async () => {
    let data = null;
    try {
      policyState.loader = true;
      const resp = await fetchApi({
        url: `/gds/dataset/${dataset.id}/policy`
      });
      if (resp.data.length > 0) {
        data = resp.data[0];
        data = resp.data[0];
        policyState.loader = false;
      }
    } catch (error) {
      console.error(
        `Error occurred while fetching dataset policy details ! ${error}`
      );
    }
    return data;
  };

  const fetchServiceDetails = async (serviceName) => {
    let data = null;
    try {
      const resp = await fetchApi({
        url: `plugins/services/name/${serviceName}`
      });
      data = resp.data || null;
    } catch (error) {
      console.error(`Error occurred while fetching service details ! ${error}`);
    }
    return data;
  };

  const generateFormData = (policyData, serviceCompData) => {
    let data = {};
    data.policyType = 0;
    if (policyData != undefined && policyData != null) {
      data.policyItems =
        policyData.id && policyData?.policyItems?.length > 0
          ? setPolicyItemVal(
              policyData?.policyItems,
              serviceCompData?.accessTypes
            )
          : [{}];
      if (policyData.id) {
        data.policyName = policyData?.name;
        data.isEnabled = policyData?.isEnabled;
        data.policyPriority = policyData?.policyPriority == 0 ? false : true;
        data.description = policyData?.description;
        data.isAuditEnabled = policyData?.isAuditEnabled;
        data.policyLabel =
          policyData &&
          policyData?.policyLabels?.map((val) => {
            return { label: val, value: val };
          });
        let serviceCompResourcesDetails = serviceCompData?.resources;
        if (policyData?.resources) {
          let lastResourceLevel = [];
          Object.entries(policyData?.resources).map(([key, value]) => {
            let setResources = find(serviceCompResourcesDetails, ["name", key]);
            data[`resourceName-${setResources?.level}`] = setResources;
            data[`value-${setResources?.level}`] = value.values.map((m) => {
              return { label: m, value: m };
            });
            lastResourceLevel.push({
              level: setResources.level,
              name: setResources.name
            });
          });
          lastResourceLevel = maxBy(lastResourceLevel, "level");
          let setLastResources = find(serviceCompResourcesDetails, [
            "parent",
            lastResourceLevel.name
          ]);
          if (setLastResources && setLastResources?.isValidLeaf) {
            data[`resourceName-${setLastResources.level}`] = {
              label: "None",
              value: "none"
            };
          }
        }
        if (policyData?.validitySchedules) {
          data["validitySchedules"] = [];
          policyData?.validitySchedules.filter((val) => {
            let obj = {};
            if (val.endTime) {
              obj["endTime"] = moment(val.endTime, "YYYY/MM/DD HH:mm:ss");
            }
            if (val.startTime) {
              obj["startTime"] = moment(val.startTime, "YYYY/MM/DD HH:mm:ss");
            }
            if (val.timeZone) {
              obj["timeZone"] = getAllTimeZoneList().find((tZoneVal) => {
                return tZoneVal.id == val.timeZone;
              });
            }
            data["validitySchedules"].push(obj);
          });
        }

        if (policyData?.conditions?.length > 0) {
          data.conditions = {};
          for (let val of policyData.conditions) {
            data.conditions[val?.type] = val?.values?.join(",");
          }
        }
      }
    }
    return data;
  };

  const getServiceDefData = async (serviceDefName) => {
    let data = null;
    let resp = {};
    try {
      resp = await fetchApi({
        url: `plugins/definitions/name/${serviceDefName}`
      });
      data = resp.data;
    } catch (error) {
      console.error(
        `Error occurred while fetching Service Definition or CSRF headers! ${error}`
      );
    }
    return data;
  };

  const setPolicyItemVal = (formData, accessTypes) => {
    return formData.map((val) => {
      let obj = {},
        accessTypesObj = [];

      if (val.hasOwnProperty("delegateAdmin")) {
        obj.delegateAdmin = val.delegateAdmin;
      }

      for (let i = 0; val?.accesses?.length > i; i++) {
        accessTypes.map((opt) => {
          if (val.accesses[i].type == opt.name) {
            accessTypesObj.push({ label: opt.label, value: opt.name });
          }
        });
      }
      obj["accesses"] = accessTypesObj;
      let principle = [];
      if (val?.groups?.length > 0) {
        val.groups.map((opt) => {
          principle.push({
            label: (
              <div>
                <img src={groupGreyIcon} height="20px" width="20px" />
                {opt}
              </div>
            ),
            value: opt,
            type: "GROUP"
          });
        });
      }
      if (val?.users?.length > 0) {
        val.users.map((opt) => {
          principle.push({
            label: (
              <div>
                <img src={userGreyIcon} height="20px" width="20px" />
                {opt}
              </div>
            ),
            value: opt,
            type: "USER"
          });
        });
      }
      if (val?.roles?.length > 0) {
        val.roles.map((opt) => {
          principle.push({
            label: (
              <div>
                <img src={roleGreyIcon} height="20px" width="20px" />
                {opt}
              </div>
            ),
            value: opt,
            type: "ROLE"
          });
        });
      }
      obj.principle = principle;
      /* Policy Condition*/
      // if (val?.conditions?.length > 0) {
      //   obj.conditions = {};
      //   for (let data of val.conditions) {
      //     obj.conditions[data.type] = data.values.join(", ");
      //   }
      // }
      if (val?.conditions?.length > 0) {
        obj.conditions = "";
        for (let data of val.conditions) {
          obj.conditions = obj.conditions + data.values.join(", ");
        }
      }
      return obj;
    });
  };

  const handleSubmit = async (values) => {
    saveAccessGrant(values);
  };

  const fetchPrincipleData = async (inputValue) => {
    let params = { name: inputValue || "", isVisible: 1 };
    let op = [];
    const principleResp = await fetchApi({
      url: "xusers/lookup/principals",
      params: params
    });
    op = principleResp.data;

    return op.map((obj) => ({
      label: (
        <div>
          <img
            src={
              obj.type == "USER"
                ? userGreyIcon
                : obj.type == "GROUP"
                ? groupGreyIcon
                : roleGreyIcon
            }
            height="20px"
            width="20px"
          />{" "}
          {obj.name}{" "}
        </div>
      ),
      value: obj.name,
      type: obj.type
    }));
  };

  const FormChange = (props) => {
    const { isDirtyField, formValues } = props;
    if (isDirtyField) {
      onDataChange(formValues, policyData);
    }
    return null;
  };

  const onConditionChange = () => {
    onDataChange(formValues, policyData);
  };

  const onRemovingPolicyItem = (index) => {
    onDataChange(undefined, undefined);
  };

  const isDirtyFieldCheck = (dirtyFields, modified, values, initialValues) => {
    let modifiedVal = false;
    if (!isEmpty(dirtyFields)) {
      for (let dirtyFieldVal in dirtyFields) {
        modifiedVal = modified?.[dirtyFieldVal];
        if (
          values?.validitySchedules ||
          modified?.validitySchedules ||
          values?.conditions ||
          modified?.conditions ||
          modifiedVal == true
        ) {
          modifiedVal = true;
          break;
        }
      }
    }
    if (
      !isEqual(values?.validitySchedules, initialValues?.validitySchedules) ||
      !isEqual(values?.conditions, initialValues?.conditions)
    ) {
      modifiedVal = true;
    }
    return modifiedVal;
  };

  return (
    <>
      {loader ? (
        <Loader />
      ) : (
        <div className="wrap-gds">
          <Form
            onSubmit={handleSubmit}
            mutators={{
              ...arrayMutators
            }}
            initialValues={formData}
            render={({
              form: {
                mutators: { push: addPolicyItem, pop }
              },
              values,
              dirtyFields,
              dirty,
              modified,
              initialValues
            }) => (
              <div className="gds-access-grant-form">
                <FormChange
                  isDirtyField={
                    dirty == true || !isEqual(initialValues, values)
                      ? isDirtyFieldCheck(
                          dirtyFields,
                          modified,
                          values,
                          initialValues
                        )
                      : false
                  }
                  formValues={values}
                />
                <div className="datasetPolicyItem">
                  <DatasetPolicyItemComp
                    formValues={values}
                    addPolicyItem={addPolicyItem}
                    attrName="policyItems"
                    serviceCompDetails={serviceCompDetails}
                    fetchPrincipleData={fetchPrincipleData}
                    onRemovingPolicyItem={onRemovingPolicyItem}
                  />
                </div>

                <div className="d-flex gap-1">
                  {/* <div>
                      <div className="form-group">
                        <p className="formHeader">Conditions</p>{" "}
                      </div>
                      <div className="mb-4">
                        <Button
                          className="pull-right btn btn-mini"
                          onClick={() => {
                            policyConditionState(true);
                          }}
                          data-js="customPolicyConditions"
                          data-cy="customPolicyConditions"
                        >
                          <i className="fa-fw fa fa-plus"></i>
                        </Button>
                        {showModal && (
                          <Field
                            className="form-control"
                            name="conditions"
                            render={({ input }) => (
                              <PolicyConditionsComp
                                policyConditionDetails={policyConditionUpdatedJSON(
                                  serviceCompDetails.policyConditions
                                )}
                                inputVal={input}
                                showModal={showModal}
                                handleCloseModal={policyConditionState}
                              />
                            )}
                          />
                        )}
                      </div>
                    </div>
                    {serviceCompDetails?.policyConditions?.length > 0 && (
                      <div className="table-responsive">
                        <table className="table table-bordered condition-group-table">
                          <thead>
                            <tr>
                              <th colSpan="2">
                              </th>
                            </tr>
                          </thead>
                          <tbody data-id="conditionData">
                            <>
                              {values?.conditions &&
                              !isEmpty(values.conditions) ? (
                                Object.keys(values.conditions).map(
                                  (keyName) => {
                                    if (
                                      values.conditions[keyName] != "" &&
                                      values.conditions[keyName] != null
                                    ) {
                                      let conditionObj = find(
                                        serviceCompDetails?.policyConditions,
                                        function (m) {
                                          if (m.name == keyName) {
                                            return m;
                                          }
                                        }
                                      );
                                      return (
                                        <tr key={keyName}>
                                          <td>
                                            <center>
                                              {" "}
                                              {conditionObj.label}{" "}
                                            </center>
                                          </td>
                                          <td>
                                            {isObject(
                                              values.conditions[keyName]
                                            ) ? (
                                              <center>
                                                {values.conditions[keyName]
                                                  .length > 1
                                                  ? values.conditions[
                                                      keyName
                                                    ].map((m) => {
                                                      return ` ${m.label} `;
                                                    })
                                                  : values.conditions[keyName]
                                                      .label}
                                              </center>
                                            ) : (
                                              <center>
                                                {values.conditions[keyName]}
                                              </center>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    }
                                  }
                                )
                              ) : (
                                <tr>
                                  <td>
                                    <center> No Conditions </center>
                                  </td>
                                </tr>
                              )}
                            </>
                          </tbody>
                        </table>
                      </div>
                    )} */}
                  <Card className="gds-action-card gds-grant-det-cond gds-bg-white">
                    <div className="gds-section-title">
                      <p className="gds-card-heading">Conditions</p>
                      <Button
                        className="btn btn-sm"
                        onClick={() => {
                          policyConditionState(true);
                        }}
                        data-js="customPolicyConditions"
                        data-cy="customPolicyConditions"
                      >
                        Add Conditions
                      </Button>
                      {/* <div> */}
                      {showModal && (
                        <Field
                          className="form-control"
                          name="conditions"
                          render={({ input }) => (
                            <PolicyConditionsComp
                              policyConditionDetails={policyConditionUpdatedJSON(
                                serviceCompDetails.policyConditions
                              )}
                              inputVal={input}
                              showModal={showModal}
                              handleCloseModal={policyConditionState}
                            />
                          )}
                        />
                      )}
                    </div>
                    <Card.Body className="px-0">
                      <>
                        {values?.conditions && !isEmpty(values.conditions) ? (
                          Object.keys(values.conditions).map((keyName) => {
                            if (
                              values.conditions[keyName] != "" &&
                              values.conditions[keyName] != null
                            ) {
                              let conditionObj = find(
                                serviceCompDetails?.policyConditions,
                                function (m) {
                                  if (m.name == keyName) {
                                    return m;
                                  }
                                }
                              );
                              return (
                                <div>
                                  {isObject(values.conditions[keyName]) ? (
                                    <div>
                                      <span>
                                        {values.conditions[keyName].length > 1
                                          ? values.conditions[keyName].map(
                                              (m) => {
                                                return ` ${m.label} `;
                                              }
                                            )
                                          : values.conditions[keyName].label}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span>{values.conditions[keyName]}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          })
                        ) : (
                          <tr>
                            <td>
                              <center> No Conditions </center>
                            </td>
                          </tr>
                        )}
                      </>
                    </Card.Body>
                  </Card>

                  <Card className="gds-action-card gds-grant-det-cond gds-bg-white">
                    <div className="gds-section-title">
                      <p className="gds-card-heading">Validity Period</p>
                      <PolicyValidityPeriodComp addPolicyItem={addPolicyItem} />
                    </div>
                    <Card.Body className="px-0">
                      <>
                        {validityPeriod != undefined &&
                        validityPeriod.length > 0 ? (
                          validityPeriod.map((obj, index) => {
                            return (
                              <div className="gds-inline-field-grp gds-inline-listing w-100">
                                <div className="wrapper">
                                  <div className="gds-left-inline-field">
                                    <span className="gds-label-color">
                                      Start Date{" "}
                                    </span>
                                  </div>
                                  {obj?.startTime != undefined ? (
                                    <span>
                                      {dateFormat(
                                        obj.startTime,
                                        "mm/dd/yyyy hh:MM:ss TT"
                                      )}
                                    </span>
                                  ) : (
                                    <p className="mb-0">--</p>
                                  )}
                                  <span className="gds-label-color pl-5">
                                    {obj?.timeZone}
                                  </span>
                                </div>
                                <div className="wrapper ">
                                  <div className="gds-left-inline-field">
                                    <span className="gds-label-color">
                                      {" "}
                                      End Date{" "}
                                    </span>
                                  </div>
                                  {obj?.endTime != undefined ? (
                                    <span>
                                      {dateFormat(
                                        obj.endTime,
                                        "mm/dd/yyyy hh:MM:ss TT"
                                      )}
                                    </span>
                                  ) : (
                                    <p className="mb-0">--</p>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="mt-1">--</p>
                        )}
                      </>
                    </Card.Body>
                  </Card>

                  {/* <div className=" gds-grant-det-cond  gds-content-border">
                    <div className="form-group">
                      <p className="formHeader">Validity Period</p>{" "}
                    </div>
                    <div className="mb-4">
                      <PolicyValidityPeriodComp addPolicyItem={addPolicyItem} />
                    </div>
                    <br />
                    {validityPeriod != undefined &&
                    validityPeriod.length > 0 ? (
                      validityPeriod.map((obj, index) => {
                        return (
                          <div className="gds-inline-field-grp">
                            <div className="wrapper">
                              <div className="gds-left-inline-field">
                                <span className="gds-label-color">
                                  Start Date{" "}
                                </span>
                              </div>
                              {obj?.startTime != undefined ? (
                                <span>
                                  {dateFormat(
                                    obj.startTime,
                                    "mm/dd/yyyy hh:MM:ss TT"
                                  )}
                                </span>
                              ) : (
                                <p>--</p>
                              )}
                              <span className="gds-label-color pl-5">
                                {obj?.timeZone}
                              </span>
                            </div>
                            <div className="wrapper">
                              <div className="gds-left-inline-field">
                                <span className="gds-label-color">
                                  {" "}
                                  End Date{" "}
                                </span>
                              </div>
                              {obj?.endTime != undefined ? (
                                <span>
                                  {dateFormat(
                                    obj.endTime,
                                    "mm/dd/yyyy hh:MM:ss TT"
                                  )}
                                </span>
                              ) : (
                                <p>--</p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="mt-1">--</p>
                    )}
                  </div> */}
                </div>
              </div>
            )}
          />
        </div>
      )}
    </>
  );
}

export default AccessGrantForm;
