import _ from 'lodash/object';
import domTools from './domTools';

/**
 * check value type
 * @param  {String}  type
 * @param  {*}  val
 * @return {Boolean}
 */
function is(type, val) {
    return Object.prototype.toString.call(val) === ("[object " + type + "]")
}

let Vue;
let validateRules = {};

let Verify = function (VueComponent) {
    this.vm = VueComponent;
    this.verifyQueue = {};                        //验证队列
    Vue.util.defineReactive(this, '$errors', {});
};

let validate = function(field, rules, isCheck) {
    let self = this;                          //this指向组件
    let vm = self;                         //Vue组件对象
    let value = _.get(vm, field);
    let ruleMsg = '';
    let curRules = null;
    let $error = null;
    let valParams = [value];
    
    //如果为验证规则为数组则进行遍历
    if (Array.isArray(rules)) {
        return rules.map(function (item) {
            return validate.call(self, field, item, isCheck);
        }).indexOf(false) === -1;
    }
    
    // 单个规则应用
    if (is("Object", rules)) {
        if(isCheck) {
            ruleMsg = rules.err || '';
        }
        if(rules && rules.params) {
            valParams = valParams.concat(rules.params);
        }
        curRules = validateRules[rules.rule];
    }

    if (!curRules) {
        console.warn("rules " + rules.rule + ' of ' + field + " not define");
        return false;
    }
    
    let valid = true;
    if(isCheck) {
        valid = curRules.apply(this, valParams);
        //错误对象
        $error = _.get(vm.$verify.$errors, field);
        
        //验证未通过
        if (!valid) {
            $error.push(ruleMsg);
            vm.$verify.$errorArray.push(ruleMsg);
        }
    }
    return valid;
};

Verify.prototype.validateRun = function(isCheck, group) {
    let self = this;
    let vm = this.vm;   //Vue实例
    let rules = vm.$options.verify;
    let verifyQueue;
    if (group) {
        if (!vm.$verify.verifyQueue[group]) {
            console.warn(group + " not found in the component");
        }
    }
    
    //分组处理
    if (group && vm.$verify.verifyQueue[group]) {
        verifyQueue = vm.$verify.verifyQueue[group];
    } else {
        verifyQueue = [];
        for (let k in vm.$verify.verifyQueue) {
            verifyQueue = verifyQueue.concat(verifyQueue, vm.$verify.verifyQueue[k])
        }
    }
    
    //错误数组,按照本次验证的顺序推入数组
    vm.$verify.$errorArray = [];
    
    //遍历验证队列进行验证
    return verifyQueue.map(function (item) {
        if (_.get(rules, item)) {
            _.set(vm.$verify.$errors, item, []);
            return validate.call(self.vm, item, _.get(rules, item), isCheck);
        }
    }).indexOf(false) === -1;
};

Verify.prototype.emptyCheck = function (group) {
    this.validateRun(false, group);
};

Verify.prototype.check = function (group) {
    this.validateRun(true, group);
};

let init = function () {
    let self = this;                    //this 指向Vue实例
    if (!self.$options.verify) {         //验证规则为空 结束
        return;
    }
    this.$verify = new Verify(self);    //添加vm实例验证属性
};

let verifyInit = function (_Vue, options) {
    Vue = _Vue;
    if (options && options.rules) {
        Object.assign(validateRules, validateRules, options.rules);
    }
    Vue.mixin({
        beforeCreate: init
    });
};

//自定义指令
let Directive = function (Vue, options) {
    Vue.directive("verify", {
        bind: function (el, binding, vnode, oldVnode) {
            let vm = vnode.context;//当前组件实例
            let expression = binding.expression;
            let errorClass = el.getAttribute('verify-class') || 'verify-error';
            
            //得到焦点 移除错误
            el.addEventListener("focus", function () {
                _.set(vm.$verify.$errors, expression, []);
            });

            // iview组件中input
            let divElementlist = el.querySelectorAll("input");
            divElementlist.forEach(element => {
                if(element.type != 'hidden') {
                    element.addEventListener("focus", function () {
                        _.set(vm.$verify.$errors, expression, []);
                    });
                    if (options && options.blur) {
                        element.addEventListener("blur", function () {
                            vm.$verify.$errorArray = [];
                            validate.call(vm, expression, _.get(vm.$options.verify, expression), true);
                        });
                    }
                }
            });
            
            //失去焦点 进行验证
            if (options && options.blur) {
                el.addEventListener("blur", function () {
                    vm.$verify.$errorArray = [];
                    validate.call(vm, expression, _.get(vm.$options.verify, expression), true);
                });
            }
            
            //添加到验证队列
            let group;
            if (binding.rawName.split(".").length > 1) {
                group = binding.rawName.split(".").pop();
            } else if (binding.arg) {
                //如果arg存在
                //v-verify:arg
                group = binding.arg;
            } else {
                group = "";
            }
            if (vm.$verify.verifyQueue[group]) {
                vm.$verify.verifyQueue[group].push(expression);
            } else {
                vm.$verify.verifyQueue[group] = [];
                vm.$verify.verifyQueue[group].push(expression);
            }
            
            _.set(vm.$verify.$errors, expression, []);
            
            let tempExpression = expression.split(".");
            let tempErrors = vm.$verify.$errors;
            // debugger;
            for (let i = 0; i < tempExpression.length - 1; i++) {
                tempErrors = tempErrors[tempExpression[i]];
            }
            let key = tempExpression[tempExpression.length - 1];
            
            
            //添加数据监听绑定 getter setter
            Vue.util.defineReactive(tempErrors, key, []);
            
            
            // //错误默认值为空
            _.set(vm.$verify.$errors, expression, []);
            
            //监听错误 移除对应的Class
            vm.$watch("$verify.$errors." + expression, function (val) {
                if (val.length) {
                    domTools.addClass(el, errorClass);
                } else {
                    domTools.removeClass(el, errorClass);
                }
            });
        }
    });
    
    Vue.directive("verified", {
        update: function (el, binding, vnode, oldVnode) {
            if (binding.value && Array.isArray(binding.value) && binding.value.length > 0) {
                domTools.apply(el, true);
                if (binding.modifiers.join) {
                    el.innerHTML = binding.value.join(",");
                    return;
                }
                el.innerHTML = binding.value[0];
            } else {
                domTools.apply(el, false);
                el.innerHTML = "";
            }
        }
    })
    
    Vue.directive("remind", {
        update: function (el, binding, vnode, oldVnode) {
            let expression = binding.expression;
            let errorText;
            if (vnode.context.$verify.$errors) {
                errorText = _.get(vnode.context.$verify.$errors, expression);
            }
            if (errorText.length) {
                domTools.apply(el, true);
                if (binding.modifiers.join) {
                    el.innerHTML = errorText.join(",");
                    return;
                }
                el.innerHTML = errorText[0];
            } else {
                domTools.apply(el, true);
                el.innerHTML = "";
            }
        }
    })
};

let install = function (Vue, rules, options) {
    validateRules = rules;
    verifyInit(Vue, options);
    Directive(Vue, options);
};

module.exports = install;