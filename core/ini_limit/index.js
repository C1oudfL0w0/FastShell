'use strict';

const Base = require('../base');
const LANG = require('../../language'); // 插件语言库
const LANG_T = antSword['language']['toastr']; // 通用通知提示

const {
    ini_limit
} = require('../../payload');

class INI_LIMIT extends Base {
    /**
   * 
   * @param {dhtmlxObject} cell 组件
   * @param {Object} top 上层对象
   */
    constructor(cell, top) {
        super(cell, top);
        this.cell = cell;
        this.form = this.createForm(this.cell,"点击'开始'以获取");
    }

    createForm(cell, res = "") {
        let self = this;
        self.infodata = {
            result: res
        }
        let form = cell.attachForm([{
            type: 'settings',
            position: 'label-left',
            labelWidth: 300,
            inputWidth: 400,
        }, {
            type: 'block',
            inputWidth: 'auto',
            list: [{
                type: 'block',
                inputWidth: 'auto',
                list: [{
                    type: "label",
                    labelWidth: 300,
                    label: "<span style='font-size:20px'>php.ini限制检测</span>"
                },
                {
                    type: 'settings',
                },
                {
                    type: "label",
                    name: "result",
                    label: `<span style='color: #000000;font-size:14px'>${self.infodata["result"]}</span>`
                },
                {
                    type: "newcolumn"
                },
                ],
            }]
        },
        ], true);
        return form;
    }

    exploit() {
        let self = this;
        self.core = self.top.core;
        self.core.request({
            _: ini_limit()
        }).then((_ret) => { // 处理返回数据
            let res = _ret['text'];
            if (res.indexOf("ERROR://") > -1) {
                throw res;
            } else if (res != "") {
                res = antSword.unxss(res, false);
                this.form = this.createForm(this.cell, res.split('\n').map(item => `<br>${item}`).join(''));
            }
        }).catch((err) => { // 处理异常数据
            toastr.error(`${LANG['error']}: ${JSON.stringify(err)}`, LANG_T['error']);
        });
    }
}

module.exports = INI_LIMIT;