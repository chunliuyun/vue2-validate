# verify
主要是应用到vue2及以上版本

### install 
```
npm install vue2-validate
```


### configure
```js
import rules from './xxxx/rules'
import verify from './xxxx/verify'

根据是否启用blur时做检验
Vue.use(verify, rules, {blur: true})  or  Vue.use(verify, rules) 

rules为总规则配置项目  如：

module.exports = {
    required: (value)=> {
        if(value === null || value === undefined) return false;
        return value.toString().trim().length>0;
    },
    minLimt: (value, len)=> {
        return value.length >= len;
    },
    maxLimit: (value, len)=> {
        return value.length <= len;
    },
    email: (value)=> {
        return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
    }
}
```


### use

使用如:
A:
```html
<Input size="small" v-model="userInfo.email" class="field-input" v-verify="userInfo.email"></Input>
<label class="fl red" v-remind="userInfo.email"></label>
```

B:
```html
<Input size="small" v-model="userInfo.phone" class="field-input" v-verify.cls="userInfo.phone"></Input>
<label class="fl red" v-remind="userInfo.phone"></label>
```

```js
data () {
    return {
        userInfo: {
            email: '',
            phone: ''
        }
    }
},
verify: {
    userInfo: {
        email: {
            rule: 'required',
            err: '必须'
        },
        phone: [{
            rule: 'required',
            err: '必须'
        },{
            rule: 'mobile',
            err: '手机号码格式错误'
        }]
    }
}
```

v-model 、v-verify和v-remind保存一致
verify中配置检验项目  检验按前后顺序

```js
所有项置空校验和校验  包括A和B
this.$verify.emptyCheck();
this.$verify.check();

对应类项置空校验和校验  仅B
this.$verify.emptyCheck('cls');
this.$verify.check(''cls);
```



### 指令说明

#### v-verify
在表单控件元素上创建数据的验证规则，他会自动匹配要验证的值以及验证的规则。

##### v-verify 修饰符说明
该指令最后一个修饰符为自定义分组  
```js
//自定义cls分组
v-verify.cls

//验证时可分开进行验证  

//验证cls分组
this.$verify.check("cls")
//验证所有
this.$verify.check();


//置空验证cls分组  提示语为空
this.$verify.emptyCheck('cls');
//置空验证所有
this.$verify.emptyCheck();
```

##### v-remind 验证错误提示

##### v-remind修饰符说明
> .join 展示所有错误 用逗号隔开

# vue2-validate
