import { initializeApp } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js";
const firebaseConfig = {
    apiKey: "AIzaSyCUbKVSVZznwevITzOvYPF0Cxoc_jioHFA",
    authDomain: "mc-order-ver-2.firebaseapp.com",
    databaseURL: "https://mc-order-ver-2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mc-order-ver-2",
    storageBucket: "mc-order-ver-2.appspot.com",
    messagingSenderId: "553746269380",
    appId: "1:553746269380:web:f8086095ef3257d2203591"
};
const app = initializeApp(firebaseConfig);

import { getDatabase, ref, child, get, set} from "https://www.gstatic.com/firebasejs/9.12.1/firebase-database.js";
const db = getDatabase(app);
const dbRef = ref(getDatabase(app));

const setData = (path, obj) => {
   set(ref(db, path), obj).then(() => {
    console.log('success');
   }).catch((error) => {
    console.error(error);
   });
}

const getData = (path) => {
    return new Promise((resolve, reject) => {
        get(child(dbRef,path)).then((snapshot) => {
            if (snapshot.exists()) {
                resolve(snapshot.val())
            } else {
                resolve("No data available")
            }
        }).catch((error) => {
            reject(error);
        })
    })
}

const getTime = () => {
    let reg = /-/g;
    let time = new Date();
    time.setHours(time.getHours() + 8);
    time = time.toJSON().substring(0,19).replace(reg, '/').replace('T',' ');
    return time;
}

const getGMT8TimeStamp = () => {
    let timeStamp = Date.now() + 28800000; // for GMT +08:00
    return timeStamp
}

const isLogin = (loginToken) => {
    if (loginToken[0] != -1 && loginToken[1] != ''){
        return true;
    } else {
        return false;
    }
}

let menuData, orderData, isBack;
let emptyOrderObj = {
    id: "",
    name: "未訂餐",
    price: 0,
    time: "",
    timeStamp: ""
}

let defaultOrderListObj = {
    name: '',
    food: {
        id: '',
        name: '未訂餐',
        price: 0,
        time: '',
        timeStamp: ''
    }
}

let defaultMenuObj = {
    titleImgUrl: './img/default.png',
    store: '',
    forTime: '尚未設定活動日期',
    forEvent: '尚未設定活動名稱',
    foodList: [{
        id: '0',
        name: '新品項',
        price: 0,
        isActive: true
    }],
    deadlineTimeStamp: '',
    deadlineTime: '尚未設定'
}

Promise.all([getData('menu/'), getData('orderList/')]).then(res => {
    menuData = res[0];
    orderData = res[1];

    menuData.foodList = menuData.foodList.filter(item => item.isActive == true);

    isBack = false;
    if (window.location.href.slice(-4) == 'back'){
        isBack = true;
    }

    let el = document.createElement('link');
    el.as = 'image';
    el.rel = 'prefetch';
    el.href = menuData.titleImgUrl;
    el.crossorigin = 'anonymous';
    document.querySelector('.forPreload').appendChild(el);

    vm.mount('#app');
}).catch((res) => {
    console.error(res);
});

const vm = Vue.createApp({
    data(){
        return{
            isBack: isBack,
            backLoginInfo: '',
            user: [],
            plusName: '',
            menu: menuData,
            order: orderData,
            time: '',
            titleImgUrl: menuData.titleImgUrl,
            viewStatus: 'login',
            loginToken: [-1, ''],
            loginAnnoucement: '',
            orderId: 0,
            orderListLatestTime: '',
            totalPrice: '',
        }
    },
    methods: {
        getTime(timeStamp){
            let newdate = new Date(timeStamp);
            // let weekAry = ['日', '一', '二', '三', '四', '五', '六'];

            // let weekIndex = newdate.getDay();
            let year = newdate.getFullYear();
            let month = newdate.getMonth() + 1 < 10? "0" + (newdate.getMonth() + 1): newdate.getMonth() + 1;
            let date  = newdate.getDate() < 10? "0" + newdate.getDate(): newdate.getDate();
            let hh    = newdate.getHours() < 10? "0" + newdate.getHours(): newdate.getHours();
            let mm    = newdate.getMinutes() < 10? "0" + newdate.getMinutes(): newdate.getMinutes();
            let ss    = newdate.getSeconds() < 10? "0" + newdate.getSeconds(): newdate.getSeconds();

            this.time = `${year}/${month}/${date}　${hh}：${mm}：${ss}`;
        },
        nowTimes(){
            this.getTime(new Date());
            setInterval(() => {
                this.getTime(new Date());
            }, 1000)
        },
        checkLogin(){
            getData('users/').then((res) => {
                this.user = res;
                let checkId = this.user.findIndex(name => name == this.loginToken[1]);
                if (checkId !== -1){
                    this.loginToken[0] = checkId;
                    this.loginAnnoucement = '';
                    this.$options.methods.toOrder.bind(this)();
                    return
                } else {
                    this.loginToken[1] = '';
                    this.loginAnnoucement = '登入失敗'
                    return
                }
            }).catch((res) => {
                console.error(res);
            })
        },
        checkBackLogin(){
            getData('users/').then((res) => {
                this.user = res;
                let checkId = this.user.findIndex(name => name == this.loginToken[1]);
                if (checkId !== -1){
                    this.viewStatus = 'logined';
                    this.backLoginInfo = `哈囉，${this.loginToken[1]}`;
                    this.loginToken[0] = checkId;
                    this.loginAnnoucement = '登入成功！';
                    return
                } else {
                    this.loginToken[1] = '';
                    this.loginAnnoucement = '登入失敗'
                    return
                }
            }).catch((res) => {
                console.error(res);
            })
        },
        logout(){
            this.loginAnnoucement = '登出成功';
            this.loginToken = [-1, ''];
            this.viewStatus = 'login';
        },
        submitOrder(){
            if (!isLogin(this.loginToken)){
                this.loginToken = [-1, ''];
                viewStatus = 'login';
                return alert('登入狀態錯誤！請重新登入');
            }
            if (getGMT8TimeStamp() > this.menu.deadlineTimeStamp){
                return alert('已超過點餐時間，請洽點餐負責人！');
            }

            let [userId, userName] = this.loginToken;

            if (this.orderId == 999){ // cancel order
                Promise.all([
                    setData(`orderList/${userId}/food/`, emptyOrderObj),
                ]).then(() => {
                    alert('清除訂單成功！請確定訂單是否正確！');
                    this.$options.methods.toOrderStatus.bind(this)();
                }).catch((res) => {
                    console.error(res);
                })
                return
            }
            let oldOrderName = this.order[this.loginToken[0]].food.name;
            let orderId = this.orderId;
            let orderFood, orderPrice;
            this.menu.foodList.forEach(item => {
                if (item.id == orderId){
                    orderFood = item.name;
                    orderPrice = item.price;
                }
            })

            let orderObj = {
                name: userName,
                food:{
                    id: orderId,
                    name: orderFood,
                    price: orderPrice,
                    timeStamp: getGMT8TimeStamp(),
                    time: getTime()
                }
            }
            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '點餐',
                action: `${oldOrderName}→${orderFood}`
            }

            Promise.all([
                setData(`orderList/${userId}/`, orderObj),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                alert('點餐成功！請確定訂單是否正確！');
                this.$options.methods.toOrderStatus.bind(this)();
            }).catch((res) => {
                console.error(res);
            })
        },
        toOrderStatus(){
            getData('orderList/').then((res) => {
                this.order = res;
                this.$options.methods.toUpdateOrderListLatestTime.bind(this)();
                this.$options.methods.totalFood.bind(this)();
            }).catch((res) => {
                console.error(res);
            });
            this.viewStatus = 'orderList';
        },
        toOrder(){
            if (!isLogin(this.loginToken)){
                this.loginToken = [-1, ''];
                this.loginAnnoucement = '請登入後操作';
                this.viewStatus = 'login';
                return;
            } else {
                getData('orderList/').then((res) => {
                    this.order = res;
                    if (this.order[this.loginToken[0]].food.id != ''){
                        this.orderId = this.order[this.loginToken[0]].food.id;
                    }
                }).catch((res) => {
                    console.error(res);
                });
                this.viewStatus = 'order';
            }
        },
        toPrevBlock(){
            if (isBack == true){
                if (this.loginToken[0] != -1 && this.loginToken[1] != ''){
                    this.viewStatus = 'logined';
                    return;
                } else {
                    this.viewStatus = 'login';
                    return;
                }
            }
            if (this.loginToken[0] != -1 && this.loginToken[1] != ''){
                this.viewStatus = 'order';
            } else {
                this.loginToken = [-1, ''];
                this.loginAnnoucement = '';
                this.viewStatus = 'login';
            }
        },
        toUpdateOrderListLatestTime(){
            if (this.order)
            this.order.sort((a,b) => {
                return b.food.timeStamp - a.food.timeStamp
            })
            let d = new Date(this.order[0].food.timeStamp)
            if (d == 'Invalid Date') {
                this.orderListLatestTime = "未有訂單";
                return;
            }
            let month = d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1): d.getMonth() + 1;
            let date  = d.getDate() < 10 ? "0" + d.getDate(): d.getDate();
            let updateTime = d.toTimeString().slice(0,8);
            this.orderListLatestTime = `${month}/${date}　${updateTime}`
        },
        totalFood(){
            let orderList = this.order.filter(item => item.food != '未訂餐');
            let arr = [];
            this.totalPrice = 0;
            this.menu.foodList.forEach(food => {
                let amount = orderList.filter(item => item.food.name == food.name).length
                arr.push(amount);
                this.totalPrice += amount * food.price;
            })

            return arr;
        },
        toEditMember(){
            if (!isLogin(this.loginToken)){
                this.loginToken = [-1, ''];
                this.loginAnnoucement = "請登入後操作"
                return
            }
            this.viewStatus = 'editMember';

            getData('users/').then((res) => {
                this.user = res;
            }).catch((res) => {
                console.error(res);
            })
        },
        plusMember(){
            if (this.plusName == ''){
                return alert('名稱不得為空！');
            }
            getData('users/').then((res) => {
                this.user = res;
                if (this.user.filter(item => item == this.plusName)[0] != undefined){
                    this.plusName = '';
                    return alert('名稱不得重複！');
                }
            }).then(() => {
                let neworderObj = {...defaultOrderListObj};
                neworderObj.name = this.plusName;
                
                let logObj = {
                    userName: this.loginToken[1],
                    time : getTime(),
                    actionType: '新增成員',
                    action: `新增${this.plusName}`
                }
                setData(`users/${this.user.length}`, this.plusName);
                setData(`orderList/${this.user.length}`, neworderObj);
                setData(`log/0/${getGMT8TimeStamp()}`, logObj);
            }).then(() => {
                getData('users/').then((res) => {
                    this.plusName = '';
                    this.user = res
                });
            }).catch((res) => {
                console.error(res);
            })
        },
        deleteMember(e){
            let delUserId = e.target.closest('li').dataset.id;
            if (delUserId == this.loginToken[0]){
                alert('不要刪除自己LA');
                return
            }

            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '刪除成員',
                action: `刪除${this.user[delUserId]}`
            }
            Promise.all([
                setData(`users/${delUserId}`, null),
                setData(`orderList/${delUserId}`, null),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                getData('users/').then((res) => {
                    this.user = res;
                    this.user = this.user.filter(item => item) // clear null
                    let checkId = this.user.findIndex(name => name == this.loginToken[1]);
                    this.loginToken[0] = checkId;
                }).then(() =>{
                    setData(`users`, this.user);
                }).catch((res) => {
                    console.error(res);
                });
            })
        },
        toEditMenu(){
            if (!isLogin(this.loginToken)){
                this.loginToken = [-1, ''];
                this.loginAnnoucement = "請登入後操作"
                return
            }
            getData('menu/').then((res) => {
                this.menu = res;
                this.menu.foodList = this.menu.foodList.filter(item => item.isActive == true);
            }).catch((res) => {
                console.error(res);
            })
            this.viewStatus = 'editMenu'
        },
        toEditBlock(e){
            e.target.closest('li').classList.toggle('active');
        },
        updateEvent(e){
            let oldEvent = `${this.menu.forTime} ${this.menu.forEvent}`;

            let ary = document.querySelectorAll('input[data-type="event"]');
            let reg = / /g;
            ary[2].value = ary[2].value.replace(reg, '');
            if (ary[0].value == '' || ary[1].value == '' || ary[2].value == ''){
                return alert('請檢查欄位，輸入不得為空！');
            }
            let newEventMonth = parseInt(ary[0].value) + 1 < 10 ? "0" + ary[0].value : ary[0].value;
            let newEventDay = parseInt(ary[1].value) + 1 < 10 ? "0" + ary[1].value : ary[1].value;
            let newEventName = ary[2].value;
            let newEventDate = `${newEventMonth}/${newEventDay}`

            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '更改活動',
                action: `${oldEvent}→${newEventDate} ${newEventName}`
            }

            Promise.all([
                setData(`menu/forTime`, newEventDate),
                setData(`menu/forEvent`, newEventName),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                getData('menu/').then((res) => {
                    this.menu = res;
                    e.target.closest('li').classList.toggle('active');
                }).catch((res) => {
                    console.error(res);
                })
            })
        },
        updateDeadline(e){
            let input = document.querySelector('input[data-type="deadline"]');
            let newDDL = new Date(input.value + ':00+08:00');
            if (newDDL == 'Invalid Date'){
                return alert('日期不得為空！');
            }
            newDDL.setHours(newDDL.getHours() + 8);

            let newDateObj = new Date(newDDL);
            let timeStampDDL = newDateObj.getTime();

            newDDL = newDDL.toJSON();
            let reg0 = /-/g;
            let reg1 = /:/g;
            newDDL = newDDL.replace(reg0, '/').replace(reg1, '：').replace('T', '　');
            newDDL = newDDL.substring(0, 19);
            
            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '更改截止期限',
                action: `新期限：${newDDL}`
            }

            Promise.all([
                setData(`menu/deadlineTime`, newDDL),
                setData(`menu/deadlineTimeStamp`, timeStampDDL),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                getData('menu/').then((res) => {
                    console.log(res);
                    this.menu = res;
                    e.target.closest('li').classList.toggle('active');
                }).catch((res) => {
                    console.error(res);
                })
            })
        },
        updateMenu(e){
            let id = e.target.closest('li').dataset.id;
            let oldFoodName, oldFoodPrice;
            if (id >= this.menu.foodList.length){
                oldFoodName = '新品項';
                oldFoodPrice = 0;
            } else {
                oldFoodName = this.menu.foodList[id].name;
                oldFoodPrice = this.menu.foodList[id].price;
            }
            
            let ary = document.querySelectorAll(`input[data-id="${id}"]`);
            let reg = / /g;
            ary[0].value = ary[0].value.replace(reg, '');
            ary[1].value = ary[1].value.replace(reg, '');
            if (ary[0].value == '' | ary[1].value == ''){
                return alert('請檢查欄位，輸入不得為空！');
            }
            let newFoodName = ary[0].value;
            let newFoodPrice = parseInt(ary[1].value);

            let foodObj = {
                id: id,
                isActive: true,
                name: newFoodName,
                price: newFoodPrice
            }

            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '更改品項',
                action: `${oldFoodName}/$${oldFoodPrice}→${newFoodName}/$${newFoodPrice}`
            }

            Promise.all([
                setData(`menu/foodList/${id}/`, foodObj),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                getData('orderList/').then((res) => {
                    this.order = res;
                    this.order.forEach(item => {
                        if (item.food.id == id){
                            item.food.name = newFoodName;
                            item.food.price = newFoodPrice;
                        }
                    });
                    setData(`orderList/`, this.order);
                }).catch((res) => {
                    console.error(res);
                })
            }).then(() => {
                getData('menu/').then((res) => {
                    this.menu = res;
                    this.menu.foodList = this.menu.foodList.filter(item => item.isActive == true);
                    e.target.closest('li').classList.toggle('active');
                }).catch((res) => {
                    console.error(res);
                })
            })
        },
        deleteFood(e){
            let id = e.target.closest('li').dataset.id;
            let delFoodName, delFoodPrice;
            this.menu.foodList.forEach(item => {
                if (item.id == id){
                    delFoodName = item.name;
                    delFoodPrice = item.price;
                }
            })

            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '刪除品項',
                action: `刪除${delFoodName}/$${delFoodPrice}`
            }
            Promise.all([
                setData(`menu/foodList/${id}/isActive`, false),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                getData('orderList/').then((res) => {
                    this.order = res;
                    this.order.forEach(item => {
                        if (item.food.id == id){
                            item.food = emptyOrderObj;
                        }
                    });
                    setData(`orderList/`, this.order);
                }).catch((res) => {
                    console.error(res);
                })
            }).then(() => {
                getData('menu/').then((res) => {
                    this.menu = res;
                    this.menu.foodList = this.menu.foodList.filter(item => item.isActive == true);
                }).catch((res) => {
                    console.error(res);
                })
            })
        },
        plusOrderList(){
            getData('menu/').then((res) => {
                let lastIndex = this.menu.foodList[this.menu.foodList.length - 1].id;
                if (lastIndex < res.foodList.length){
                    lastIndex = res.foodList.length;
                } else {
                    lastIndex += 1
                }
                this.menu.foodList.push({
                    id: lastIndex,
                    isActive: true,
                    name: "新品項！",
                    price: 0
                })
            }).catch((error) => {
                console.error(error);
            })
        },
        startNewMenu(){
            let newStore = prompt('請輸入店家名稱');
            if (newStore == null){
                return;
            }
            newStore = newStore.trim();
            if (newStore == ''){
                return alert('網址不得為空！');
            }

            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '開新菜單',
                action: `店家名：${newStore}`
            }
            
            defaultMenuObj.store = newStore;

            let orderList = [];
            this.user.forEach((item, index) => {
                orderList.push({...defaultOrderListObj});
                orderList[index].name = item;
            })
            console.log(orderList);

            Promise.all([
                setData(`menu/`, defaultMenuObj),
                setData(`orderList/`, orderList),
                setData(`log/0/${getGMT8TimeStamp()}`, logObj)
            ]).then(() => {
                Promise.all([getData('menu/'), getData('orderList/'), getData('log/')]).then(res => {
                    this.menu = res[0];
                    this.order = res[1];
                    let log = res[2]
                    let newLogAry = [];
                    log.forEach((item, index) => {
                        newLogAry[index + 1] = item;
                    })
                    newLogAry[3] = null
                    setData(`log/`, newLogAry);
                }).catch((res) => {
                    console.error(res);
                });
            })

        },
        changeTitleImg(){
            let oldImgUrl = this.titleImgUrl;
            if (oldImgUrl == './img/default.png'){
                oldImgUrl = 'default';
            };

            let newImgUrl = prompt('請輸入圖片網址，或輸入 default 恢復 logo', oldImgUrl);
            if (newImgUrl == null){
                return;
            }
            newImgUrl = newImgUrl.trim();
            if (newImgUrl == ''){
                return alert('網址不得為空！');
            }

            let logObj = {
                userName: this.loginToken[1],
                time : getTime(),
                actionType: '更換封面',
                action: `${oldImgUrl}/$${newImgUrl}`
            }
            let reg1 = /\.jpg$|\.jpeg|\.png$/;
            if (newImgUrl == 'default'){
                this.titleImgUrl == './img/default.png';
                Promise.all([
                    setData(`menu/titleImgUrl`, './img/default.png'),
                    setData(`log/0/${getGMT8TimeStamp()}`, logObj)
                ]).then(() => {
                    return alert('更新成功！');
                })
            } else if (reg1.test(newImgUrl) == true){
                this.titleImgUrl == newImgUrl;
                Promise.all([
                    setData(`menu/titleImgUrl`, newImgUrl),
                    setData(`log/0/${getGMT8TimeStamp()}`, logObj)
                ]).then(() => {
                    return alert('更新成功！');
                })
            } else {
                return alert('請檢查圖片格式！')
            }
        }
    },
    created() {
        this.nowTimes();
    },
    mounted() {
        this.nowTimes();
    }
});