import { React, Immutable, type UseDataSource, type IMFieldSchema, DataSourceManager, type IMIconResult, uuidv1 } from 'jimu-core'
import { Button, Icon, Label, Radio, Switch, TextInput } from 'jimu-ui'
import { SettingSection, SidePopper, SettingRow } from 'jimu-ui/advanced/setting-components'
import { WidgetQueryOutlined } from 'jimu-icons/outlined/brand/widget-query'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector, AllDataSourceTypes, FieldSelector } from 'jimu-ui/advanced/data-source-selector'
import { type IMConfig } from '../config'
import defaultMessages from './translations/default'
import { IconPicker } from 'jimu-ui/advanced/resource-selector'

interface State {
  showSidePanel: boolean
  activeItemId: string
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {
  constructor(props) {
    super(props)
    this.state = {
      showSidePanel: false,
      activeItemId: ''
    }
  }

  supportedTypes = Immutable([AllDataSourceTypes.FeatureLayer])

  onItemClick = (item) => {
    const {
      dsConfigs,
      useDataSourcesMap
    } = this.props.config
    const clickItemId = item?.id
    const { activeItemId } = this.state

    if (!dsConfigs) return

    if (clickItemId !== activeItemId) {
      const {
        id,
        dataSourceId: clickDsId,
        label,
        icon,
        showCount,
        showList,
        fields,
        groupField,
        featureIconType
      } = item

      this.props.onSettingChange({
        id: this.props.id,
        useDataSources: useDataSourcesMap ? useDataSourcesMap[clickDsId] : [],

        config: {
          ...this.props.config,
          activeDSConfig: {
            id,
            dataSourceId: clickDsId,
            label,
            icon,
            showCount,
            showList,
            fields,
            groupField,
            featureIconType
          }
        }
      })

      this.setState({
        showSidePanel: true,
        activeItemId: clickItemId
      })
    }
  }

  onToggleUseDataEnabled = (useDataSourcesEnabled: boolean) => {
    this.props.onSettingChange({
      id: this.props.id,
      useDataSourcesEnabled
    })
  }

  onDataSourceChange = (useDataSources: UseDataSource[]) => {
    let dataSourceId = ''
    let label = ''
    let icon = null
    let showCount = false
    let showList = false
    let fields = []
    let groupField = []
    let featureIconType = 0

    if (useDataSources?.length > 0) {
      dataSourceId = useDataSources[0].dataSourceId
      label = DataSourceManager.getInstance().getDataSource(dataSourceId).getLabel()
      icon = this.props.config.activeDSConfig.icon
      showCount = this.props.config.activeDSConfig.showCount
      showList = this.props.config.activeDSConfig.showList
      fields = this.props.config.activeDSConfig.fields.asMutable()
      groupField = this.props.config.activeDSConfig.groupField.asMutable()
      featureIconType = this.props.config.activeDSConfig.featureIconType
    }
    const dsConfigs = this.changeItemAtIndex({
      dataSourceId,
      label,
      icon,
      showCount,
      showList,
      fields,
      groupField,
      featureIconType
    })

    const { useDataSourcesMap } = this.props.config

    this.props.onSettingChange({
      id: this.props.id,
      useDataSources: [
        {
          ...useDataSources[0],
          useFieldsInSymbol: true
        }
      ],
      config: {
        ...this.props.config,
        useDataSourcesMap: {
          ...useDataSourcesMap,
          [dataSourceId]: useDataSources
        },
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          dataSourceId,
          label,
          icon,
          showCount,
          showList,
          fields,
          groupField,
          featureIconType
        }
      }
    })
  }

  changeItemAtIndex = (obj, tag = 'change') => {
    const { dsConfigs } = this.props.config
    const { activeItemId } = this.state

    if (!dsConfigs) return

    if (tag === 'change') {
      if (!obj) {
        return
      }
      if (!dsConfigs || dsConfigs.length <= 0) {
        return
      }

      return dsConfigs
        .asMutable({ deep: true })
        .map((item, index) => {
          if (item.id === activeItemId) {
            return {
              ...item,
              ...obj
            }
          }

          return item
        })
    } else if (tag === 'delete') {
      const newDSConfigs = [...dsConfigs.asMutable({ deep: true })]
      const deleteItemInd = newDSConfigs
        .findIndex(item => {
          return item.id === obj.id
        })

      newDSConfigs.splice(deleteItemInd, 1)

      return newDSConfigs
    }
  }

  onFieldChange = (allSelectedFields: IMFieldSchema[]) => {
    const fields = allSelectedFields.map(f => f.jimuName)
    const dsConfigs = this.changeItemAtIndex({ fields })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          fields
        }
      }
    })
  }

  onGroupChange = (allSelectedFields: IMFieldSchema[]) => {
    const groupField = allSelectedFields.map(f => f.jimuName)
    const dsConfigs = this.changeItemAtIndex({ groupField })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          groupField
        }
      }
    })
  }

  onInputChange = (evt: React.FormEvent<HTMLInputElement>) => {
    const label = evt.currentTarget.value
    const dsConfigs = this.changeItemAtIndex({ label })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          label
        }
      }
    })
  }

  addSummary = (evt: React.FormEvent<HTMLInputElement>) => {
    const { dsConfigs } = this.props.config
    const lastItem = dsConfigs[dsConfigs.length - 1]
    if (lastItem && !lastItem.dataSourceId) {
      this.setState({ showSidePanel: true, activeItemId: lastItem.id })
      return
    }

    const id = uuidv1()
    const newItem = {
      id,
      dataSourceId: '',
      label: '',
      icon: null,
      showCount: false,
      showList: false,
      fields: [],
      groupField: [],
      featureIconType: 0
    }

    if (!dsConfigs) return

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs:
          [
            ...dsConfigs.asMutable({ deep: true }),
            { ...newItem }
          ],
        activeDSConfig: { ...newItem }
      }
    })
    this.setState({
      showSidePanel: true,
      activeItemId: id
    })
  }

  getItemUDS = () => {
    const { useDataSources, config: { dsConfigs } } = this.props
    const { activeItemId } = this.state

    if (useDataSources && useDataSources.length > 0 &&
      dsConfigs && dsConfigs.length > 0) {
      const dsId = useDataSources[0].dataSourceId
      const dsConfigsM = dsConfigs.asMutable({ deep: true })

      if (dsConfigsM
        .filter((item, index) => {
          if (item.id === activeItemId) {
            return item.dataSourceId === dsId
          }
          return false
        }).length > 0) {
        return useDataSources
      }
    }

    return null
  }

  closeSidePopper = () => {
    this.setState({
      showSidePanel: false,
      activeItemId: ''
    })
  }

  handleCountSwitch = (evt: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const showCount = checked
    const dsConfigs = this.changeItemAtIndex({ showCount })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          showCount
        }
      }
    })
  }

  handleFeatureListSwitch = (evt: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const showList = checked
    const dsConfigs = this.changeItemAtIndex({ showList })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          showList
        }
      }
    })
  }

  onIconChange = (icon: IMIconResult) => {
    const dsConfigs = this.changeItemAtIndex({ icon })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          icon: icon.asMutable({ deep: true })
        }
      }
    })
  }

  onFeatureIconChange = (evt, checked, value) => {
    const featureIconType = value
    const dsConfigs = this.changeItemAtIndex({ featureIconType })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        dsConfigs,
        activeDSConfig: {
          ...this.props.config.activeDSConfig,
          featureIconType
        }
      }
    })
  }

  deleteItem = (item) => {
    const { id } = item
    const { activeItemId } = this.state
    const dsConfigs = this.changeItemAtIndex(item, 'delete')
    let propsConfig = null

    if (id === activeItemId) {
      propsConfig = {
        id: this.props.id,
        config: {
          ...this.props.config,
          dsConfigs,
          activeDSConfig: {
            id: '',
            dataSourceId: '',
            label: undefined,
            icon: null,
            showCount: false,
            showList: false,
            fields: [],
            groupField: [],
            featureIconType: 0
          }
        }
      }

      this.setState({ showSidePanel: false, activeItemId: '' })
    } else {
      propsConfig = {
        id: this.props.id,
        config: {
          ...this.props.config,
          dsConfigs
        }
      }
    }
    this.props.onSettingChange(propsConfig)
  }

  getActiveItemStyle = (item) => {
    const { activeItemId } = this.state

    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgb(88,88,88)',
      borderLeft: `${item.id !== activeItemId
        ? '2px'
        : '2px solid rgb(43, 189, 207)'}`,
      padding: '6px 10px 6px 5px',
      borderRadius: '2px',
      cursor: 'pointer',
      margin: '0 0 15px 0'
    }
  }

  handleSearchSwich = (evt: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const showSearch = checked

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        showSearch
      }
    })
  }

  getDisabledFields = () => {
    const { dataSourceId, fields } = this.props.config.activeDSConfig
    const allFields = DataSourceManager.getInstance().getDataSource(dataSourceId)?.getSelectedFields() || []

    return allFields.filter(field => {
      return !fields.includes(field)
    })
  }

  getDSListContent = () => {
    const { dsConfigs } = this.props.config
    return dsConfigs && dsConfigs.length > 0 &&
      dsConfigs
        .map(item => {
          return <div style={this.getActiveItemStyle(item)}>
            {
              !item.label &&
              <WidgetQueryOutlined size={16} style={{ width: '20px' }} color='#e6dddd' />
            }

            <div
              onClick={() => { this.onItemClick(item) }}
              id={item.id}
              defaultValue={item.label}
              style={{
                flex: 1,
                marginLeft: '0 10px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
              {item.label || '......'}
            </div>

            <CloseOutlined onClick={() => { this.deleteItem(item) }} style={{ width: '16px' }} size={12} color='#e6dddd' />

          </div>
        })
  }

  getSearchContent = () => {
    const {
      showSearch,
      dsConfigs
    } = this.props.config

    return dsConfigs &&
      dsConfigs.length > 0 &&
      dsConfigs
        .filter(item => {
          return item.fields?.length > 0
        })
        .length === dsConfigs.length &&
      <div>
        <SettingRow
          flow="no-wrap"
          label="Search"
        >
          <Switch
            aria-label="search-switch"
            onChange={this.handleSearchSwich}
            checked={showSearch}
          />
        </SettingRow>

        <SettingRow
          flow='no-wrap'>
          <p>Fields selected for feature list will be used to search.</p>
        </SettingRow>
      </div>
  }

  getDSContent = () => {
    return <SettingSection
      className="info-summary-section"
      title={this.props.intl.formatMessage({
        id: 'infoSummaryWidget',
        defaultMessage: defaultMessages.infoSummaryWidget
      })}
    >
      <Button
        size="default"
        block
        type="primary"
        onClick={this.addSummary}
      >
        <Icon
          icon="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; fill=&quot;none&quot; viewBox=&quot;0 0 16 16&quot;><path fill=&quot;#000&quot; d=&quot;M7.5 0a.5.5 0 0 0-.5.5V7H.5a.5.5 0 0 0 0 1H7v6.5a.5.5 0 0 0 1 0V8h6.5a.5.5 0 0 0 0-1H8V.5a.5.5 0 0 0-.5-.5&quot;></path></svg>"
          size="s"
        />
        New summary
      </Button>

      <br />
      {this.getDSListContent()}
      <br />
      {this.getSearchContent()}

    </SettingSection>
  }

  getDSSettingPanel = () => {
    const {
      activeDSConfig: {
        label,
        icon,
        showCount,
        showList,
        fields,
        groupField,
        featureIconType
      }
    } = this.props.config

    return this.getItemUDS() && this.getItemUDS().length > 0 &&

      <SettingSection
        aria-label="Label"
        role="group"
        title="Label"
      >

        <div style={{ marginBottom: '16px' }}>
          <TextInput
            type="text"
            allowClear={true}
            value={label}
            onChange={this.onInputChange} />
        </div>

        <SettingRow
          flow="no-wrap"
          label="icon"
        >
          <IconPicker
            configurableOption="color"
            hideRemove
            previewOptions={{
              autoFlip: true,
              color: true
            }}
            onChange={this.onIconChange}
            icon={icon?.asMutable({ deep: true })}
          />
        </SettingRow>

        <SettingRow
          flow="no-wrap"
          label="Count"
        >
          <Switch
            aria-label="count-switch"
            onChange={this.handleCountSwitch}
            checked={showCount}
          />
        </SettingRow>

        <SettingRow
          flow="no-wrap"
          label="Feature list"
        >
          <Switch
            aria-label="feature-list-switch"
            onChange={this.handleFeatureListSwitch}
            checked={showList}
          />
        </SettingRow>

        {
          showList &&
          <div style={{ margin: '16px 0' }}>
            <SettingRow
              flow='wrap'
              label="Configure fields">
              <FieldSelector
                useDataSources={this.props.useDataSources}
                onChange={this.onFieldChange}
                selectedFields={Immutable(fields) || Immutable([])}
                isMultiple
                useMultiDropdownBottomTools
                useDropdown
                isDataSourceDropDownHidden
              />
            </SettingRow>

            <SettingRow
              flow='wrap'
              label="Group by">
              <FieldSelector
                useDataSources={this.props.useDataSources}
                onChange={this.onGroupChange}
                selectedFields={Immutable(groupField) || Immutable([])}
                useMultiDropdownBottomTools
                useDropdown
                noSelectionItem={{ name: 'clear' }}
                isDataSourceDropDownHidden
                hiddenFields={Immutable(this.getDisabledFields()) || Immutable([])}
              />
            </SettingRow>

            <SettingRow
              flow='wrap'
              label="Feature icon">
              <div>
                <Label className='d-flex align-items-center'>
                  <Radio name='radio1' className='mr-2' checked={featureIconType === 0} onChange={(evt, checked) => {
                    this.onFeatureIconChange(evt, checked, 0)
                  }} />
                  None
                </Label>
                <Label className='d-flex align-items-center'>
                  <Radio name='radio1' className='mr-2' checked={featureIconType === 1} onChange={(evt, checked) => {
                    this.onFeatureIconChange(evt, checked, 1)
                  }} />
                  Symbol
                </Label>
                <Label check className='d-flex align-items-center'>
                  <Radio name='radio1' className='mr-2' checked={featureIconType === 2} onChange={(evt, checked) => {
                    this.onFeatureIconChange(evt, checked, 2)
                  }} />
                  Static icon
                </Label>
              </div>

            </SettingRow>
          </div>
        }
      </SettingSection>
  }

  getDSConfigContent = () => {
    const { activeItemId } = this.state

    return <SidePopper
      position="right"
      title="Data"
      aria-label={activeItemId}
      toggle={this.closeSidePopper}
      widgetId={this.props.id}
      trigger={null}
      isOpen={this.state.showSidePanel}
      children={
        <div style={{ padding: '0 15px' }}>
          <DataSourceSelector
            types={this.supportedTypes}
            useDataSources={this.getItemUDS()}
            useDataSourcesEnabled={this.props.useDataSourcesEnabled}
            onToggleUseDataEnabled={this.onToggleUseDataEnabled}
            onChange={this.onDataSourceChange}
            widgetId={this.props.id}
            mustUseDataSource
            closeDataSourceListOnChange
          />

          {this.getDSSettingPanel()}
        </div>
      }
    />
  }

  render() {
    return <div className="widget-setting-info-summary">
      {this.getDSContent()}
      {this.getDSConfigContent()}
    </div>
  }
}
