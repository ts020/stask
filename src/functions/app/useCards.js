import { ref as vueData, onMounted } from "vue";

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, child } from "firebase/database";

import firebaseConfig from "../../data/firebaseConfig.js"

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getDatabase()
const dbRef = ref(db);

const welcomeCard = {
  "title": "Staskへようこそ",
  "time": 123,
  "startPage": 50,
  "lastPage": 100,
  "nowPage": 75,
  "showSubMenu": false,
  "done": false,
  "subject": 1
}

class Cards {
  constructor(newCards){
    if(newCards != undefined){
      this.data = newCards
    }else{
      this.data = [welcomeCard]
    }
  }
  
  get value(){
    return this.data
  }
}

export default ()=>{
  const cards = vueData([])

  onMounted(()=>{
    onAuthStateChanged(auth, (user) => {
      if (user) {
        //ユーザー情報の全体への反映
        const uid = user.uid

        //ユーザー情報から設定やタスクの取得
        get(child(dbRef, `data/${uid}`)).then((snapshot) => {
          if (snapshot.exists()) {
            const newData = snapshot.val()
            
            const newCards = new Cards(newData.cards)
            cards.value = newCards.value

          } else {
            cards.value = [welcomeCard]
          }
        }).catch((error) => {
          console.error(error);
        });
      }
    });
  })

  return { cards }
}