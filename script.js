"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

class Workout {
  id = (Date.now() + "").slice(-10);
  date = new Date();
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //km
    this.duration = duration; //min
  }

  setDescription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.type = "running";
    this.cadence = cadence;
    this.calcPace();
    this.setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance; // min/km
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.type = "cycling";
    this.elevation = elevation;
    this.calcSpeed();
    this.setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////////////////
//App architecture
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this._getLocation();

    //Handling the change event on the form
    inputType.addEventListener("change", this._toggleActivity);

    //Submit event handling
    form.addEventListener("submit", this._submitForm.bind(this));

    //adding the move to marker event
    containerWorkouts.addEventListener("click", this._moveToMarker.bind(this));
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

  _hideForm() {
    //clear the input fields
    inputDistance.value =
      inputDuration.value =
      inputDuration.value =
      inputCadence.value =
        "";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => {
      form.style.display = "grid";
    }, 1000);
  }

  _toggleActivity() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _submitForm(e) {
    e.preventDefault();
    let workout;

    //validate input function
    const isFinite = (...inputs) => inputs.every((inp) => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every((inp) => inp > 0);

    //Getting coords
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];

    //get the value of the input fields
    let type = inputType.value;
    let distance = +inputDistance.value;
    let duration = +inputDuration.value;

    //for running workout, create a running object
    if (type === "running") {
      let cadence = +inputCadence.value;
      //validate their values
      if (
        !isFinite(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert("Input needs to be positive");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //for cycling workout, create a cycling object
    if (type === "cycling") {
      let elevation = +inputElevation.value;
      //validate their values
      if (
        !isFinite(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert("Input needs to be positive");

      workout = new Cycling(coords, distance, duration, elevation);
    }

    //push the workout in the workouts array
    this.#workouts.push(workout);

    //render the workout
    this._renderWorkout(workout);

    //hide form
    this._hideForm();

    //render workout marker on the map
    this._renderWorkoutMarker(workout);
  }

  _renderWorkoutMarker(workout) {
    const { lat, lng } = this.#mapEvent.latlng;

    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup([lat, lng], {
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(
          `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
        )
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${
              workout.type === "running" ? workout.pace : workout.speed
            }</span>
            <span class="workout__unit">${
              workout.type === "running" ? "min/km" : "km/h"
            }</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === "running" ? "🦶🏼" : "⛰"
            }</span>
            <span class="workout__value">${
              workout.type === "running" ? workout.cadence : workout.elevation
            }</span>
            <span class="workout__unit">${
              workout.type === "running" ? "spm" : "m"
            }</span>
          </div>
        </li>
  
  `;

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToMarker(e) {
    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;
    // console.log(workoutEl);

    const workout = this.#workouts.find(
      (workout) => workout.id === workoutEl.dataset.id
    );

    // console.log(workout);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 0.75,
      },
    });

    //tracking the number of clicks happening per workout
    workout.click();
    console.log(workout);
  }
}

const app = new App();
