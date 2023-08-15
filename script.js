"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  id = (Date.now() + "").slice(-10);
  date = new Date();

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //km
    this.duration = duration; //min
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance; //min/km
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const cycling1 = new Cycling([32, -19], 12, 5, 15);
const running1 = new Running([32, -19], 12, 5, 15);

console.log(cycling1);
console.log(running1);

/////////////////////////////////////////////////////////////
//App architecture
class App {
  #map;
  #mapEvent;

  constructor() {
    this._getLocation();

    //Handling the change event on the form
    inputType.addEventListener("change", this._toggleActivity);

    //Submit event handling
    form.addEventListener("submit", this._submitForm.bind(this));
  }

  _getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Failed to get the co-ordinates");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toggleActivity() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _submitForm(e) {
    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup([lat, lng], {
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${inputType.value}-popup`,
        }).setContent(inputType.value)
      )
      .openPopup();

    //Clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        "";
    inputType.value = "running";

    form.classList.add("hidden");
  }
}

const app = new App();
