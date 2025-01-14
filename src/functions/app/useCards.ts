import { ref as vueData, onBeforeMount, watch } from "vue";

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, set, child } from "firebase/database";

import firebaseConfig from "../../data/firebaseConfig"
import type { Card } from "../../types/card"

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getDatabase()
const dbRef = ref(db);

const welcomeCard = {
  title: "Staskへようこそ",
  time: 123,
  pages: [],
  done: false,
  subject: 1,
  term: "2023-01-01"
}

type CardsData = Array<Card>

interface Cards {
  data: CardsData
}

type TwoDigitNumber = (newNumber: number) => string

class Cards {
  constructor(newCards: CardsData){
    if(newCards != undefined){
      this.data = newCards
    }else{
      this.data = [welcomeCard]
    }
  }
  
  get value(){
    return this.data
  }

  addCard(twoDigitNumber: TwoDigitNumber){
    const today = new Date()
    const thisYear = today.getFullYear()
    const thisMonth = twoDigitNumber(today.getMonth()+1)
    const thisDate = twoDigitNumber(today.getDate())
    const newCard = {
      title: "",
      time: 60,
      pages: [],
      done: false,
      subject: 1,
      term: `${thisYear}-${thisMonth}-${thisDate}`
    }
    this.data.push(newCard)
  }

  deleteCard(cardIndex: number){
    this.data.splice(cardIndex, 1)
  }

  deleteDoneCard(){
    for (let i = 0; i < this.data.length;){
      if(this.data[i].done == true){
        this.data.splice(i, 1)
      }else{
        i++
      }
    }
  }

  saveCards(uid: string){
    return new Promise<void>((resolve)=>{
      const savePath = `data/${uid}/cards`
      set(ref(db, savePath), this.data)
        .then(()=>{
          resolve()
        })
        .catch((err)=>{
          console.error(err);
        })
    })
  }
}

export default (twoDigitNumber: TwoDigitNumber)=>{
  const cards = vueData<CardsData>([])

  let uid: string

  onBeforeMount(()=>{
    onAuthStateChanged(auth, (user) => {
      if (user) {
        uid = user.uid

        get(child(dbRef, `data/${uid}/cards`)).then((snapshot) => {
          if (snapshot.exists()) {
            const newData = snapshot.val()
            
            const newCards = new Cards(newData)
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
  
  //データが変更されているかどうか
  const updated = vueData(true)
  const firstUpdate = vueData(true)

  const showBanner = vueData(false)

  let timer: number

  watch(cards, ()=>{
    if(firstUpdate.value == true){
      firstUpdate.value = false
    }else{
      clearTimeout(timer)
      updated.value = false
      showBanner.value = false
      timer = setTimeout(()=>{
        const newCards = new Cards(cards.value)
        newCards.saveCards(uid)
          .then(()=>{
            updated.value = true
          })
      }, 8000)
    }
  }, {deep: true})

  const addCard = ()=>{
    const newCards = new Cards(cards.value)
    newCards.addCard(twoDigitNumber)
    cards.value = newCards.value
  }

  const deleteCard = (cardIndex:number)=>{
    const newCards = new Cards(cards.value)
    newCards.deleteCard(cardIndex)
    cards.value = newCards.value
  }

  const deleteDoneCard = ()=>{
    const newCards = new Cards(cards.value)
    newCards.deleteDoneCard()
    cards.value = newCards.value
  }

  return {
    cards,
    addCard, deleteCard, deleteDoneCard,
    updated, showBanner
  }
}