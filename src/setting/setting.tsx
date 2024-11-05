/**
  Licensing

  Copyright 2020 Esri

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
import { React, Immutable, UseDataSource, IMFieldSchema, DataSourceManager, IMIconResult, IconResult, css, jsx } from 'jimu-core'
import { Button, Icon, Label, Radio, Switch, TextInput } from 'jimu-ui'
import { SettingSection, SidePopper, SettingRow } from 'jimu-ui/advanced/setting-components'
import { WidgetQueryOutlined } from 'jimu-icons/outlined/brand/widget-query'
import { CloseOutlined } from 'jimu-icons/outlined/editor/close'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector, AllDataSourceTypes, FieldSelector } from 'jimu-ui/advanced/data-source-selector'
import { type IMConfig } from '../config'
import defaultMessages from './translations/default'
import defaultI18nMessages from './translations/default'
import { IconPicker } from 'jimu-ui/advanced/resource-selector'
import { createRef } from 'react'

interface State {
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {
  private addItemRef: React.RefObject<HTMLButtonElement>
  private summaryItemRef: React.RefObject<HTMLDivElement>

  constructor(props) {
    super(props)
    this.addItemRef = createRef()
    this.summaryItemRef = createRef()
  }

  supportedTypes = Immutable([AllDataSourceTypes.FeatureLayer])


  componentDidMount(): void {
    // console.log('did mounted', this.props.config)
    window.addEventListener('click', this.clickEventHandler)
  }

  clickEventHandler = (e) => {
    let { target: { className }, y, x } = e

    if (className == 'icon-btn-sizer' &&
      y <= 86 && y >= 68 &&
      x >= 675 && x <= 700) {
      this.props.onSettingChange({
        id: this.props.id,
        config: {
          ...this.props.config,
          sideBarActive: false,
          activeItemId: ""
        }
      })
    }
  }

  onItemClick = (item) => {
    const {
      summaryItems,
      activeItemId,
      activeItemSetting: { dataSourceId },
      useDataSourcesMap
    } = this.props.config
    // const { activeItemId } = this.state
    const clickItemId = item?.id

    console.log('click', useDataSourcesMap)

    if (!summaryItems) return

    if (clickItemId != activeItemId) {

      const {
        id,
        dataSourceId: clickDsId,
        label,
        icon,
        showCount,
        showList,
        fields,
        groupField,
        featureIconType } = item

      this.props.onSettingChange({
        id: this.props.id,
        useDataSources: useDataSourcesMap ? useDataSourcesMap[clickDsId] : [],

        config: {
          ...this.props.config,
          sideBarActive: true,
          activeItemId: clickItemId,
          activeItemSetting: {
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
    }
  }

  onToggleUseDataEnabled = (useDataSourcesEnabled: boolean) => {

    this.props.onSettingChange({
      id: this.props.id,
      useDataSourcesEnabled
    })
  }

  onDataSourceChange = (useDataSources: UseDataSource[]) => {
    let dataSourceId = ""
    let label = ""
    let icon = null
    let showCount = false
    let showList = false
    let fields = []
    let groupField = []
    let featureIconType = 0

    if (useDataSources?.length > 0) {
      dataSourceId = useDataSources[0].dataSourceId
      label = DataSourceManager.getInstance().getDataSource(dataSourceId).getLabel()
      icon = this.props.config.activeItemSetting.icon
      showCount = this.props.config.activeItemSetting.showCount
      showList = this.props.config.activeItemSetting.showList
      fields = this.props.config.activeItemSetting.fields.asMutable()
      groupField = this.props.config.activeItemSetting.groupField.asMutable()
      featureIconType = this.props.config.activeItemSetting.featureIconType
    }
    const summaryItems = this.changeItemAtIndex({
      dataSourceId,
      label,
      icon,
      showCount,
      showList,
      fields,
      groupField,
      featureIconType
    })

    let { useDataSourcesMap } = this.props.config


    this.props.onSettingChange({
      id: this.props.id,
      useDataSources,
      config: {
        ...this.props.config,
        useDataSourcesMap: {
          ...useDataSourcesMap,
          [dataSourceId]: useDataSources
        },
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
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

  changeItemAtIndex = (obj, tag = "change") => {
    const { summaryItems, activeItemId } = this.props.config
    // const { activeItemId } = this.state

    if (!summaryItems) return

    if (tag === 'change') {
      if (!obj) {
        return
      }
      if (!summaryItems || summaryItems.length <= 0) {
        return
      }

      return summaryItems
        .asMutable({ deep: true })
        .map((item, index) => {

          if (item['id'] == activeItemId) {
            return {
              ...item,
              ...obj
            }
          }

          return item
        })
    } else if (tag === 'delete') {
      let newSummaryItems = [...summaryItems.asMutable({ deep: true })]
      let deleteItemInd = newSummaryItems
        .findIndex(item => {
          return item['id'] == obj.id
        })

      newSummaryItems.splice(deleteItemInd, 1)

      return newSummaryItems
    }

  }

  onFieldChange = (allSelectedFields: IMFieldSchema[]) => {
    const fields = allSelectedFields.map(f => f.jimuName)
    const summaryItems = this.changeItemAtIndex({ fields })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          fields
        }
      }
    })
  }

  onGroupChange = (allSelectedFields: IMFieldSchema[]) => {

    const groupField = allSelectedFields.map(f => f.jimuName)
    const summaryItems = this.changeItemAtIndex({ groupField })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          groupField
        }
      }
    })
  }

  onInputChange = (evt: React.FormEvent<HTMLInputElement>) => {
    const label = evt.currentTarget.value
    const summaryItems = this.changeItemAtIndex({ label })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          label
        }
      }
    })
  }

  addSummary = (evt: React.FormEvent<HTMLInputElement>) => {
    const { summaryItems, itemAddUpCount } = this.props.config
    const id = `summary-${itemAddUpCount}`
    const count = itemAddUpCount + 1
    const newItem = {
      id,
      dataSourceId: "",
      label: "",
      icon: null,
      showCount: false,
      showList: false,
      fields: [],
      groupField: [],
      featureIconType: 0
    }

    if (!summaryItems) return

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems:
          [...summaryItems.asMutable({ deep: true }),
          {
            ...newItem
          }
          ],
        itemAddUpCount: count,
        activeItemId: id,
        sideBarActive: true,
        activeItemSetting: { ...newItem }
      }
    })
    // this.setState({
    //   activeItemId: id

    // })

    // console.log('add summary finished...', this.props.config.summaryItems)

  }

  getItemUDS = () => {
    const { useDataSources, config: { summaryItems, activeItemId } } = this.props
    // const { activeItemId } = this.state
    // console.log(this.props)


    if (useDataSources && useDataSources.length > 0
      && summaryItems && summaryItems.length > 0) {
      const dsId = useDataSources[0].dataSourceId
      const summaryItemsM = summaryItems.asMutable({ deep: true })

      if (summaryItemsM
        .filter((item, index) => {
          if (item.id == activeItemId) {
            return item.dataSourceId == dsId
          }
        }).length > 0) {
        return useDataSources
      }

    }

    return null
  }

  closeSidePopper = (evt: React.MouseEvent<HTMLButtonElement>) => {
    const { sideBarActive } = this.props.config

    if (sideBarActive) {
      this.props.onSettingChange({
        id: this.props.id,
        config: {
          ...this.props.config,
          sideBarActive: false
        }
      })
    }
  }

  handleCountSwitch = (evt: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const showCount = checked
    const summaryItems = this.changeItemAtIndex({ showCount })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          showCount
        }
      }
    })
  }

  handleFeatureListSwitch = (evt: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    const showList = checked
    const summaryItems = this.changeItemAtIndex({ showList })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          showList
        }
      }
    })
  }

  onIconChange = (icon: IMIconResult) => {
    const summaryItems = this.changeItemAtIndex({ icon })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          icon: icon.asMutable({ deep: true })
        }
      }
    })
  }

  onFeatureIconChange = (evt, checked, value) => {
    const featureIconType = value
    const summaryItems = this.changeItemAtIndex({ featureIconType })

    this.props.onSettingChange({
      id: this.props.id,
      config: {
        ...this.props.config,
        summaryItems,
        activeItemSetting: {
          ...this.props.config.activeItemSetting,
          featureIconType
        }
      }
    })
  }

  deleteItem = (item) => {

    const { id } = item
    const { activeItemId } = this.props.config
    // const { activeItemId } = this.state
    let summaryItems = this.changeItemAtIndex(item, 'delete')
    let propsConfig = null

    if (id == activeItemId) {
      propsConfig = {
        id: this.props.id,
        config: {
          ...this.props.config,
          sideBarActive: false,
          summaryItems,
          activeItemId: "",
          activeItemSetting: {
            id: "",
            dataSourceId: "",
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
      // this.setState({
      //   // sideBarActive: false,
      //   activeItemId: ""
      // })
    } else {
      propsConfig = {
        id: this.props.id,
        config: {
          ...this.props.config,
          summaryItems
        }
      }
    }
    this.props.onSettingChange(propsConfig)
  }

  getActiveItemStyle = (item) => {
    // const { activeItemId } = this.state
    const { activeItemId } = this.props.config

    return {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'rgb(88,88,88)',
      borderLeft: `${item['id'] != activeItemId
        ? '2px' : '2px solid rgb(43, 189, 207)'}`,
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
    const { dataSourceId, fields } = this.props.config.activeItemSetting
    const allFields = DataSourceManager.getInstance().getDataSource(dataSourceId)?.getSelectedFields() || []

    return allFields.filter(field => {
      return fields.indexOf(field) < 0
    })
    // console.log(allFields)
  }


  render() {
    const {
      sideBarActive,
      showSearch,
      summaryItems,
      activeItemId,
      activeItemSetting: {
        label,
        icon,
        showCount,
        showList,
        fields,
        groupField,
        featureIconType
      }
    } = this.props.config
    // const { activeItemId } = this.state

    this.getDisabledFields()

    return <div className="widget-setting-info-summary">
      <SettingSection
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
        // ref={this.addItemRef}
        >
          <Icon
            icon="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; fill=&quot;none&quot; viewBox=&quot;0 0 16 16&quot;><path fill=&quot;#000&quot; d=&quot;M7.5 0a.5.5 0 0 0-.5.5V7H.5a.5.5 0 0 0 0 1H7v6.5a.5.5 0 0 0 1 0V8h6.5a.5.5 0 0 0 0-1H8V.5a.5.5 0 0 0-.5-.5&quot;></path></svg>"
            size="s"
          />
          New summary
        </Button>

        <br />

        {
          summaryItems && summaryItems.length > 0 &&
          summaryItems
            .map(item => {
              return <div style={this.getActiveItemStyle(item)}>
                {
                  !item.label &&
                  <WidgetQueryOutlined size={16} style={{ width: '20px' }} color='#e6dddd' />
                }

                <div
                  onClick={() => this.onItemClick(item)}
                  id={item.id}
                  defaultValue={item.label}
                  // ref={this.summaryItemRef}
                  style={{
                    flex: 1,
                    marginLeft: '0 10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                  {item.label || '......'}
                </div>

                <CloseOutlined onClick={() => this.deleteItem(item)} style={{ width: '16px' }} size={12} color='#e6dddd' />

              </div>
            })
        }

        <br />
        {
          summaryItems &&
          summaryItems.length > 0
          &&
          summaryItems
            .filter(item => {
              return item.fields?.length > 0
            })
            .length == summaryItems.length
          &&
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

      </SettingSection>


      <SidePopper
        position="right"
        title="Data"
        aria-label={activeItemId}
        toggle={() => this.closeSidePopper}
        widgetId={this.props.id}
        // trigger={this.addItemRef.current || this.summaryItemRef.current}
        trigger={null}
        isOpen={sideBarActive}
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

            {
              this.getItemUDS() && this.getItemUDS().length > 0 &&

              <SettingSection
                aria-label="Label"
                role="group"
                title="Label"
              >

                <div style={{ marginBottom: "16px" }}>
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
                  <div style={{ margin: "16px 0" }}>
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
                            this.onFeatureIconChange(evt, checked, 0);
                          }} />
                          None
                        </Label>
                        <Label className='d-flex align-items-center'>
                          <Radio name='radio1' className='mr-2' checked={featureIconType === 1} onChange={(evt, checked) => {
                            this.onFeatureIconChange(evt, checked, 1);
                          }} />
                          Symbol
                        </Label>
                        <Label check className='d-flex align-items-center'>
                          <Radio name='radio1' className='mr-2' checked={featureIconType === 2} onChange={(evt, checked) => {
                            this.onFeatureIconChange(evt, checked, 2);
                          }} />
                          Static icon
                        </Label>
                      </div>

                    </SettingRow>
                  </div>
                }
              </SettingSection>
            }
          </div>
        }
      />


    </div>
  }
}
