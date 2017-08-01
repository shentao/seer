/** @jsx h */
import Seer from './seer'

const App = Seer({
  data: {
    character: {
      name: 'Cloud Strife',
      age: 0,
      class: 'SOLDAT',
      gender: null,
      skills: [1, 2, 3],
    },
    evilCharacter: 'Sephiroth',
    placeholder: 'Choose your side!',
    side: null,
    characterSummary () {
      return `${this.character.name} is ${this.character.age} years old. Class: ${this.character.class}.`
    },
    selectedCharacter () {
      switch (this.side) {
        case 'Good':
          return `Your character is ${this.characterSummary}!`
        case 'Evil':
          return `Your character is ${this.evilCharacter}!`
        default:
  			  return this.placeholder
		  }
    },
    selectedCharacterSentenceLength () {
      return this.side === 'Noop' ? 'noop' : this.selectedCharacter.length
    }
  },
  watch: {
    selectedCharacterSentenceLength () {
      console.log(this.selectedCharacterSentenceLength)
    }
  },
  render (h) {
    return <div>
      <input type="text" onInput={updateText('evilCharacter')}/>
      <h1>Hello { this.evilCharacter }</h1>
    </div>
  }
}).$mount('#app')

function updateText (prop) {
  return e => {
  	App.data[prop] = e.target.value
  }
}
