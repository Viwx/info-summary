import { css } from 'jimu-core'

export const style = css` 
.info-summary {
    padding: 5px;
    background-color: aliceblue;

    .info-summary__loading {
        position: absolute;
        left: 50%;
        top: 50%;
    }

    .info-summary__header {
        display: flex;
        align-items: center;

        .header-search {
            flex: 1;
            margin-right: 15px;
        }
    }

    .info-summary__content {
        .summary__label {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid lightgray;

            .label__icon {
                margin-left: 10px;
            }

            .label__text {
                margin: 0 10px;
                flex: 1;
            }

            .label__count{
                margin-right: 10px;
            }
        }

        .summary__label--active {
            display: flex;
            width: 100%;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid lightgray;
            border-left: 5px solid rgb(0, 122, 194);

            .label__icon {
                margin-left: 10px;
            }

            .label__text {
                margin: 0 10px;
                flex: 1;
            }

            .label__count{
                margin-right: 10px;
            }
        }

        .summary__content {
            .item__label{
                margin-left: 50px;
                padding: 10px 0 0 0;
            }
            .item__content{
                 cursor: pointer;
                 margin-left: 50px; 
                 padding: 10px;
                 border-bottom: 1px solid lightgray;

                 .item__content-icon{
                    margin-right: 10px
                 }
            }
        }
    }
}`
