/** @jsx jsx */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { React, type AllWidgetProps, jsx, DataSourceManager, DataSourceComponent, DataSource, FeatureLayerDataSource, DataRecord, QueriableDataSource, DataRecordSet, MessageManager, DataRecordsSelectionChangeMessage, DataSourceStatus, IMDataSourceInfo, QueryParams } from 'jimu-core'
import { type IMConfig, type DSConfig } from '../config'
import { CollapsablePanel, Icon, TextInput, DataActionList, DataActionListStyle } from 'jimu-ui'
import { SearchOutlined } from 'jimu-icons/outlined/editor/search'
import { style } from './lib/style'
import { createRef } from 'react'

interface State {
  dataBuffer: SummaryItemData[]
  isDataLoaded: boolean
  dataSets: DataRecordSet[]
  filterSqlStr: string
  activeItems: string[]
}

export interface SummaryItemData {
  count: number
  records: DataRecord[]
  dataSourceId: string
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, State> {
  private readonly searchRef: React.RefObject<HTMLInputElement>

  constructor (props) {
    super(props)
    this.state = {
      dataBuffer: [],
      isDataLoaded: false,
      dataSets: [],
      filterSqlStr: '',
      activeItems: []
    }
    this.searchRef = createRef()
  }

  shouldComponentUpdate (prevProps: Readonly<AllWidgetProps<IMConfig>>, prevState: Readonly<State>, snapshot?: any): boolean {
    const { dataBuffer, activeItems } = prevState
    const { config } = prevProps
    const configFields = Object.keys(config)

    const isDSChange = dataBuffer.filter((item, index) => {
      const dataSourceId = this.state.dataBuffer[index]?.dataSourceId
      const count = this.state.dataBuffer[index]?.count

      return item.dataSourceId !== dataSourceId || item.count !== count
    }).length > 0
    const isPropsConfigChange = configFields.filter(key => {
      return config[key] !== this.props.config[key]
    }).length > 0

    if (isDSChange || isPropsConfigChange) {
      return true
    }
    if (activeItems.toString() !== this.state.activeItems.toString()) {
      return true
    }

    return false
  }

  isDataSourceLoaded = (dataSourceId: string): SummaryItemData => {
    const { dataBuffer } = this.state

    return dataBuffer.length > 0 && dataBuffer.find(item => item.dataSourceId === dataSourceId)
  }

  loadDataSources = async (value: string) => {
    const usdIds = this.props.config.dsConfigs.map(item => item.dataSourceId)
    let queryQueue = []
    let queryResults = []
    let dataBuffer = []
    const dataSets = []
    const filterSqlStr = usdIds.length === 1
      ? this.state.filterSqlStr || '1=1'
      : '1=1'

    for (let i = 0; i < usdIds.length; i++) {
      const id = usdIds[i]
      const dsManager = DataSourceManager.getInstance()
      const ds = dsManager.getDataSource(id) as FeatureLayerDataSource
      const fields = this.props.config.dsConfigs[i].fields.join(',')
      const itemQuery = {
        where: value
          ? `concat(${fields}) like '%${value}%' AND ${filterSqlStr}`
          : '1=1',
        outFields: ['*'],
        pageSize: 100
      }

      if (ds && ds?.query) {
        queryQueue = queryQueue.concat(ds?.query(itemQuery))
        dataSets.push(
          {
            name: ds.getLabel(),
            dataSource: ds,
            type: 'current',
            fields: this.props.config.dsConfigs[i].fields
          })
      }
    }

    if (queryQueue.length > 0) {
      queryResults = await Promise.all(queryQueue)

      dataBuffer = queryResults.map((result, index) => {
        dataSets[index].records = result.records

        return {
          count: result.records?.length || 0,
          records: result.records,
          dataSourceId: usdIds[index]
        }
      })

      this.setState({
        dataBuffer: [...dataBuffer],
        isDataLoaded: true,
        dataSets: dataSets
      })
    } else {
      this.clearDataSources()
    }

    return dataBuffer
  }

  clearDataSources = () => {
    this.setState({
      dataBuffer: [],
      isDataLoaded: false,
      dataSets: []
    })
  }

  query = (value) => {
    this.loadDataSources(value)
  }

  formatDataRecords = (item) => {
    const {
      dataSourceId,
      fields,
      groupField
    } = item

    const records = this.isDataSourceLoaded(dataSourceId)?.records
    const recordsData = {
      isGrouped: false,
      recordsMap: new Map(),
      groupFieldName: null
    }

    if (!records) return ''

    if (groupField.length > 0) {
      const groupFieldName = groupField[0]
      recordsData.isGrouped = true
      recordsData.groupFieldName = groupFieldName

      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const listItemData = {
          id: record.getId()
        }

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i]
          listItemData[field] = record.getFieldValue(field)
        }

        const mapKey = listItemData[groupFieldName]
        const recordsMap = recordsData.recordsMap

        if (recordsMap.has(mapKey)) {
          recordsMap.set(mapKey, recordsMap.get(mapKey).concat(listItemData))
        } else {
          recordsMap.set(mapKey, [listItemData])
        }
      }
    } else {
      for (let i = 0; i < records.length; i++) {
        const record = records[i]
        const listItemData = {
          id: record.getId()
        }

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i]
          listItemData[field] = record.getFieldValue(field)
        }
        const recordsMap = recordsData.recordsMap
        if (recordsMap.get(null)) {
          recordsMap.set(null, recordsMap.get(null).concat(listItemData))
        } else {
          recordsMap.set(null, [listItemData])
        }
      }
    }

    return recordsData
  }

  getSummaryLabelClassName = (itemId: string) => {
    const { activeItems } = this.state

    return activeItems
      .find(id => id === itemId)
      ? 'summary__label--active'
      : 'summary__label'
  }

  getSummaryItemLabel = (summaryItem: DSConfig) => {
    const { id, icon, label, showCount, dataSourceId } = summaryItem

    if (!dataSourceId) return ''
    const itemData = this.isDataSourceLoaded(dataSourceId)
    const ds = DataSourceManager.getInstance().getDataSource(dataSourceId)

    return <div className={this.getSummaryLabelClassName(id)}>
      {
        icon &&
        <Icon className='label__icon' icon={icon.svg} color={icon.properties.color}></Icon>
      }

      <span className='label__text'>{label}</span>

      {
        showCount && ds &&
        <span className='label__count'>{itemData?.count || 0}</span>
      }
    </div>
  }

  formatFeatureFields = (feature) => {
    const keys = Object.keys(feature)
    let formatFields = ''

    for (let i = 0; i < keys.length; i++) {
      if (keys[i] === 'id') continue

      if (formatFields !== '') {
        formatFields += `, ${feature[keys[i]]}`
      } else {
        formatFields += feature[keys[i]]
      }
    }

    return formatFields
  }

  getFeatureIcon = (summaryItem: DSConfig, symbol?: string) => {
    const { featureIconType, icon } = summaryItem

    if (featureIconType === 0) {
      return null
    } else if (featureIconType === 1) {
      const imgUrl = 'data:image/png;base64,' + symbol
      return <Icon className='item__content-icon' icon={imgUrl} ></Icon >
    } else if (featureIconType === 2) {
      return <Icon className='item__content-icon' icon={icon.svg} color={icon.properties.color}></Icon>
    }

    return null
  }

  onSelectRecord = (recordId: string, ds: DataSource) => {
    if (recordId && ds) {
      const selectedRecordIds = ds.getSelectedRecordIds()
      const featureDs = ds as FeatureLayerDataSource

      featureDs.queryById(recordId).then((rd) => {
        MessageManager.getInstance().publishMessage(new DataRecordsSelectionChangeMessage(this.props.id, [rd]))

        if (!selectedRecordIds.includes(recordId)) {
          ds.selectRecordsByIds([recordId], [rd])
        }
      })
    }
  }

  getSummaryItemContent = (summaryItem: DSConfig) => {
    const formatData = this.formatDataRecords(summaryItem)
    if (!formatData) return

    const { isGrouped, recordsMap, groupFieldName } = formatData
    if (!recordsMap) return

    const dsManager = DataSourceManager.getInstance()
    const ds = dsManager.getDataSource(summaryItem.dataSourceId) as FeatureLayerDataSource

    const symbol = ds?.getCapabilities()?.layerDefinition?.drawingInfo?.renderer?.symbol?.imageData

    if (isGrouped) {
      const entries = [...recordsMap.entries()]

      return entries?.map(([key, records], index) => {
        return <CollapsablePanel
          label={<div className='item__label'>{`${groupFieldName} : ${key}`}</div>}
          level={1}
          type="default"
          defaultIsOpen
        >
          {records.map(
            record => <div onClick={() => { this.onSelectRecord(record.id, ds) }} className='item__content'>
              {this.getFeatureIcon(summaryItem, symbol)}
              {this.formatFeatureFields(record)}
            </div>
          )}
        </CollapsablePanel >
      })
    } else {
      return recordsMap.get(null)?.map(
        record => <div onClick={() => { this.onSelectRecord(record.id, ds) }} className='item__content'>
          {this.getFeatureIcon(summaryItem, symbol)}
          {this.formatFeatureFields(record)}
        </div>
      )
    }
  }

  getLoadingContent = () => {
    let loadingContent = null

    if (!this.state.isDataLoaded) {
      loadingContent = (
        <div className='info-summary__loading jimu-secondary-loading' ></div>
      )
    }

    return loadingContent
  }

  getHeaderContent = () => {
    let headerContent = null
    const { dataSets } = this.state

    if (this.state.isDataLoaded && this.props.config.showSearch) {
      headerContent = (
        <div className="info-summary__header">
          <div className="header-search">
            <TextInput
              placeholder="Search"
              prefix={<SearchOutlined />}
              type="search"
              ref={this.searchRef}
              onAcceptValue={this.query} />
          </div>

          <div className="header-btn">
            <DataActionList
              widgetId={this.props.id}
              dataSets={dataSets}
              listStyle={DataActionListStyle.Dropdown}
              buttonType='tertiary'
            />
          </div>
        </div>
      )
    }
    return headerContent
  }

  onSummaryOpen = (itemId: string) => {
    const { activeItems } = this.state

    this.setState({
      activeItems: [...activeItems, itemId]
    })
  }

  onSummaryClose = (itemId: string) => {
    const { activeItems } = this.state
    const pos = activeItems.findIndex((value) => {
      return value === itemId
    })
    const newActiveItems = [...activeItems]
    newActiveItems.splice(pos, 1)

    this.setState({
      activeItems: newActiveItems
    })
  }

  getFeaturesContent = () => {
    const { dsConfigs } = this.props.config

    return (
      <div>
        {dsConfigs &&
          dsConfigs.length &&
          dsConfigs
            .filter(item => {
              return !!item.dataSourceId
            })
            .map(item => {
              return <CollapsablePanel
                label={this.getSummaryItemLabel(item.asMutable({ deep: true }))}
                level={0}
                type="default"
                defaultIsOpen
                onRequestOpen={() => { this.onSummaryOpen(item.id) }}
                onRequestClose={() => { this.onSummaryClose(item.id) }}
              >
                <div className='summary__content'>
                  {this.getSummaryItemContent(item.asMutable({ deep: true }))}
                </div>
              </CollapsablePanel>
            })
        }
      </div >
    )
  }

  getSummaryInfoContent = () => {
    const { dataBuffer } = this.state
    let featureInfoContent = null

    if (dataBuffer.length > 0) {
      featureInfoContent = this.getFeaturesContent()
    }

    return (
      <div className="info-summary__content">
        {featureInfoContent}
      </div>
    )
  }

  onDataSourceCreated = (dataSource: QueriableDataSource): void => {
    this.loadDataSources('')
  }

  getContent = (ds: DataSource) => {
    return ds && ds.getStatus() === DataSourceStatus.Loaded &&
      ds.getRecords().map(record => <div>
        {record.getId()}
      </div>)
  }

  onDataSourceInfoChange = (info: IMDataSourceInfo, preInfo?: IMDataSourceInfo): void => {
    const queries = info?.widgetQueries as QueryParams
    const preQueries = preInfo?.widgetQueries as QueryParams

    // eslint-disable-next-line no-useless-return
    if (queries && !preQueries) {
      const entires = Object.entries(queries)
      const where = entires[0][1].asMutable({ deep: true })?.where || ''

      this.setState({
        filterSqlStr: where
      }, () => {
        const value = this.searchRef.current?.value
          ? this.searchRef.current?.value
          : ''
        this.loadDataSources(value)
      })
    } else if (queries && preQueries) {
      const entires = Object.entries(queries)
      const preEntries = Object.entries(preQueries)

      // dataSource filter works
      // when there is only one dataSource in use
      if (entires.length === 1 && preEntries.length === 1) {
        const dsId = entires[0][0]
        const preDsId = preEntries[0][0]
        const where = entires[0][1].where
        const preWhere = preEntries[0][1].where

        if (dsId === preDsId && where !== preWhere) {
          this.setState({
            filterSqlStr: where
          }, () => {
            const value = this.searchRef.current?.value
              ? this.searchRef.current?.value
              : ''
            this.loadDataSources(value)
          })
        }
      }
    }
  }

  getDataSourceContent = () => {
    let dataSourceContent = null
    const useDataSourcesMap = this.props.config.useDataSourcesMap
    const dsIds = Object.keys(useDataSourcesMap)

    dataSourceContent = (
      <div style={{ position: 'absolute', display: 'block' }}>
        {dsIds.map((dsId, index) => {
          const useDataSource = useDataSourcesMap.asMutable({ deep: true })[dsId][0]
          return (
            <DataSourceComponent
              useDataSource={useDataSource}
              query={{}}
              widgetId={this.props.id}
              onDataSourceCreated={this.onDataSourceCreated}
              onDataSourceInfoChange={this.onDataSourceInfoChange}
            />
          )
        })}
      </div>

    )
    return dataSourceContent
  }

  render () {
    const {
      config: {
        dsConfigs
      }
    } = this.props
    let content = null

    if (dsConfigs && dsConfigs?.length) {
      content = (
        <div className='info-summary'>
          {this.getLoadingContent()}
          {this.getHeaderContent()}
          {this.getSummaryInfoContent()}
          {this.getDataSourceContent()}
        </div>
      )
    } else {
      content = null
    }

    return (
      <div css={style} className="jimu-widget" style={{ overflow: 'auto' }}>
        {content}
      </div>
    )
  }
}
