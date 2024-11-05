import { IconResult } from "jimu-core"

export interface SummaryItemSettingProps {
    id: string,
    dataSourceId: string,
    label: string,
    icon: IconResult,
    showCount: boolean,
    showList: boolean,
    fields: Array<string>,
    groupField: Array<string>,
    featureIconType: number
}