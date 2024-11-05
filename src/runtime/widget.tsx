/** @jsx jsx */
/**
  Licensing

  Copyright 2022 Esri

  Licensed under the Apache License, Version 2.0 (the "License"); You
  may not use this file except in compliance with the License. You may
  obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
  implied. See the License for the specific language governing
  permissions and limitations under the License.

  A copy of the license is available in the repository's
  LICENSE file.
*/
import { React, type AllWidgetProps, css, jsx, DataSourceManager, FeatureLayerQueryParams, DataSourceComponent, DataSource, DataSourceStatus } from 'jimu-core'
import { type IMConfig } from '../config'
import { Tabs, Tab, Button, CollapsablePanel, Icon, Loading } from 'jimu-ui'
import { SummaryItemSettingProps } from '..'
import { ReactNode, createRef } from 'react'


interface State {
  itemQueryResults: any,
  itemQueries: FeatureLayerQueryParams[],
  itemquery: FeatureLayerQueryParams
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, State> {
  private searchRef: React.RefObject<HTMLInputElement>

  constructor(props) {
    super(props)

    this.state = {
      itemQueryResults: [],
      itemQueries: [],
      itemquery: null
    }
    this.searchRef = createRef()
  }

  isDsConfigured = () => {
    let usdIds = Object.keys(this.props.config.useDataSourcesMap)
    console.log(usdIds)
    let loadedCount = 0

    usdIds.forEach(id => {
      const ds = DataSourceManager.getInstance().getDataSource(id)
      console.log(ds)
      if (ds?.getStatus() === DataSourceStatus.Loaded) {
        loadedCount += 1
      }
    })

    return usdIds.length === loadedCount
  }

  queryFunc = () => {
    // if (!this.isDsConfigured()) {
    //   return
    // }

    const fieldName = this.props.useDataSources[0].fields[0]
    const w = this.searchRef.current && this.searchRef.current.value
      ? `${fieldName} like '%${this.searchRef.current.value}%'`
      : '1=1'
    this.setState({
      itemquery: {
        where: w,
        outFields: ['*'],
        pageSize: 10
      }
    }
    )
  }

  formatDataRecords = (ds, item) => {
    const {
      dataSourceId,
      fields,
      groupField,
    } = item

    const records = ds.getRecords()
    let recordsData = {
      isGrouped: false,
      recordsMap: new Map()
    }

    if (!records) return ""

    if (groupField.length > 0) {
      const groupFieldName = groupField[0]
      recordsData.isGrouped = true

      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        let listItemData = {}

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i]
          listItemData[field] = record.getFieldValue(field)
        }

        let mapKey = listItemData[groupFieldName]
        let recordsMap = recordsData.recordsMap

        if (recordsMap.has(mapKey)) {
          recordsMap.set(mapKey, recordsMap.get(mapKey).concat(listItemData))
        } else {
          recordsMap.set(mapKey, [listItemData])
        }
      }

    } else {
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        let listItemData = {}

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i]
          listItemData[field] = record.getFieldValue(field)
        }
        let recordsMap = recordsData.recordsMap
        if (recordsMap.get(null)) {
          recordsMap.set(null, recordsMap.get(null).concat(listItemData))
        } else {
          recordsMap.set(null, [listItemData])
        }
      }
    }

    return recordsData
  }

  getSummaryItemLabel = (summaryItem: SummaryItemSettingProps) => {
    const { icon, label, showCount, dataSourceId } = summaryItem
    if(!dataSourceId) return ""

    const ds = this.props.config.useDataSourcesMap[dataSourceId][0].asMutable({ deep: true })
    // console.log()

    const summaryItemLabelStyle = css`
    display: flex;
    width: 100%;
    justify-content:space-between;
    align-items: center;
  `;
    const iconStyle = css`
    margin-left: 10px;
  `
    const labelStyle = css`
    margin: 0 10px;
    flex: 1;
`;
    const countStyle = css`
    margin-right: 10px;
  `;

    return <div css={summaryItemLabelStyle}>
      {
        icon &&
        <Icon css={iconStyle} icon={icon.svg} color={icon.properties.color}></Icon>
      }

      <span css={labelStyle}>{label}</span>

      {
        showCount && ds && ds?.getRecords&&
        <span css={countStyle}>{ds.getRecords()?.length || 0}</span>
      }
    </div>
  }

  formatFeatureFields = (feature) => {
    let keys = Object.keys(feature)
    let formatFields = keys.reduce((pre, next) => feature[pre] + ', ' + feature[next])

    return formatFields
  }

  getSummaryItemContent = (ds: DataSource, summaryItem: SummaryItemSettingProps) => {

    const formatData = this.formatDataRecords(ds, summaryItem)

    console.log(ds.getRecords())
    if (!formatData) return

    const { isGrouped, recordsMap } = formatData
    if (!isGrouped || !recordsMap) return

    const entries = [...recordsMap.entries()]

    if (entries && entries.length > 0) {
      if (!isGrouped) {
        return entries.map(feature => {
          return <CollapsablePanel
            bottomLine
            label={this.formatFeatureFields(feature[1])}
            level={1}
            type="default"
          >
          </CollapsablePanel>
        })
      } else {
        return null
      }
    }

  }


  render() {
    const { config: {
      summaryItems
    } } = this.props
    const itemQuery = this.state.itemquery

    return <div className="widget-summary-list jimu-widget" style={{ overflow: 'auto' }}>
      <div>
        <input placeholder="Query value" ref={this.searchRef} />
        <button onClick={this.queryFunc}>Query</button>
      </div>

      {/* {!this.isDsConfigured() ?
        <Loading></Loading> : */}
      <div>
        {summaryItems &&
          summaryItems.length &&
          summaryItems.map(item => {
            return <CollapsablePanel
              bottomLine
              label={this.getSummaryItemLabel(item.asMutable({ deep: true }))}
              level={0}
              type="default"
              defaultIsOpen
            >
              {
                this.props.config.useDataSourcesMap[item.dataSourceId] &&
                <DataSourceComponent
                  useDataSource={this.props.config.useDataSourcesMap[item.dataSourceId][0]}
                  query={itemQuery}
                  widgetId={this.props.id}
                  queryCount>
                  {(ds) => this.getSummaryItemContent(ds, item.asMutable({ deep: true }))}
                </DataSourceComponent>
              }
            </CollapsablePanel>
          })
        }
      </div>
      {/* } */}
    </div >
  }
}
