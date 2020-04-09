/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var setPlace;
var acquired;
var rateSets;

$(document).ready(() => {
  var slideout = new Slideout({
    panel: document.getElementById("panel"),
    menu: document.getElementById("menu"),
    padding: 256,
    tolerance: 70,
  });
  setPlace = window.localStorage.getItem("place");
  if (setPlace == null) {
    setPlace = "mensariametropol";
    savePlace(setPlace);
  }
  rawJson = window.localStorage.getItem("rateSets");
  if (rawJson == null) {
    rateSets = {
      date: getDate(),
      mensariametropol: [],
      hochschulemannheim: [],
      schlossmensa: [],
    };
  } else {
    rateSets = JSON.parse(rawJson);
    if (rateSets.date != getDate()) {
      rateSets = {
        date: getDate(),
        mensariametropol: [],
        hochschulemannheim: [],
        schlossmensa: [],
      };
    }
  }
  loadRating();
});

function loadhtml(id, path, _callback = () => {}) {
  $.get("html/" + path, (data) => {
    $("button").removeClass("btnactive");
    $("#" + id).addClass("btnactive");
    $("#panel")
      .html(data)
      .promise()
      .done(() => {
        _callback();
      });
  });
}

function loadUser() {
  var token = window.localStorage.getItem("token");
  var name = window.localStorage.getItem("name");
  if (token == null || name == null) {
    loadLoginInterface();
  } else {
    loadhtml("userbtn", "user.html", () => {
      $("#username").html(name);
      var animateButton = function (e) {
        e.preventDefault;
        //reset animation
        e.target.classList.remove("animate");

        e.target.classList.add("animate");
        setTimeout(function () {
          e.target.classList.remove("animate");
        }, 700);
      };

      var bubblyButtons = document.getElementsByClassName("bubbly-button");

      for (var i = 0; i < bubblyButtons.length; i++) {
        bubblyButtons[i].addEventListener("click", animateButton, false);
      }
    });
  }
}

function loadLoginInterface() {
  loadhtml("userbtn", "login.html", () => {
    $(".form")
      .find("input, textarea")
      .on("keyup blur focus", function (e) {
        var $this = $(this),
          label = $this.prev("label");

        if (e.type === "keyup") {
          if ($this.val() === "") {
            label.removeClass("active highlight");
          } else {
            label.addClass("active highlight");
          }
        } else if (e.type === "blur") {
          if ($this.val() === "") {
            label.removeClass("active highlight");
          } else {
            label.removeClass("highlight");
          }
        } else if (e.type === "focus") {
          if ($this.val() === "") {
            label.removeClass("highlight");
          } else if ($this.val() !== "") {
            label.addClass("highlight");
          }
        }
      });

    $(".tab a").on("click", function (e) {
      e.preventDefault();

      $(this).parent().addClass("active");
      $(this).parent().siblings().removeClass("active");

      target = $(this).attr("href");

      $(".tab-content > div").not(target).hide();

      $(target).fadeIn(600);
    });
  });
}

function loadRating() {
  loadhtml("ratingbtn", "rating.html", () => {
    if (typeof acquired == "undefined") {
      var JSONString = window.localStorage.getItem("acquired");
      if (JSONString == null) {
        loadAcquired();
      } else {
        acquired = JSON.parse(JSONString);
        if (acquired.place == setPlace) {
          parseAcquired();
        } else {
          loadAcquired();
        }
      }
    } else {
      if (acquired.place == setPlace && acquired.date == getDate()) {
        parseAcquired();
      } else {
        loadAcquired();
      }
    }
  });
}

function loadAcquired() {
  $.ajax({
    url: "https://xyzq.ga/getAllItems?place=" + setPlace,
    type: "GET",
    datatype: "json",
    contentType: "application/x-www-form-urlencoded",
    success: (data) => {
      acquired = {
        place: setPlace,
        date: getDate(),
        data: data,
      };
      parseAcquired();
      window.localStorage.setItem("acquired", JSON.stringify(acquired));
    },
  });
}

function getDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = today.getFullYear();
  today = mm + "/" + dd + "/" + yyyy;
  return today;
}

function parseAcquired() {
  var cardhtml = "";
  acquired.data.forEach((e, i) => {
    cardhtml += `<div class="card">
    <p>
      ${e.details}
    </p>
    <div class="ratingdiv">
      <div class="rating" id="rating${i}" data-rate-value=0  name="${e._id}"></div>
    </div>
    <div class="ratingIndicator">
      <p class="ratingResult">${e.rating}(${e.power})</p><p class="starI">&#9733</p>
    </div>
  </div>`;
  });
  $("#cards")
    .html(cardhtml)
    .promise()
    .done(function () {
      var options = {
        max_value: 5,
        step_size: 1,
        initial_value: 0,
        symbols: {
          utf8_star: {
            base: "\u2606",
            hover: "\u2605",
            selected: "\u2605",
          },
        },
      };
      $(".rating").rate(options);
      $(".rating").on("change", function (ev, data) {
        $("#circlebtncontainer").fadeIn("slow");
      });
      rateSets[setPlace].forEach((e) => {
        $(`div[name ="${e.id}"]`).rate("setValue", e.rate);
      });
    });
}

function loadSetting() {
  loadhtml("settingsbtn", "settings.html", () => {
    $("#" + setPlace).addClass("selected");
    var placetoset = "Mensaria Metropol";
    if (setPlace == "hochschulemannheim") {
      placetoset = "Mensaria Hochschule Mannheim";
    } else if (setPlace == "schlossmensa") {
      placetoset = "Schloss Mensa";
    }
    $("#place-to-set").html(placetoset);
    initDropdown();
  });
}

function initDropdown() {
  let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
  let dropdown = document.querySelector(".dropdown");
  let oldText = document.querySelector(".old-text");
  let newText = document.querySelector(".new-text");
  let dropdownOptions = document.querySelectorAll(".dropdown__options li");
  dropdown.addEventListener("click", async () => {
    if (!dropdown.classList.contains("open")) {
      dropdown.classList.add("open");
    } else {
      dropdown.classList.add("close");
      await sleep(600);
      dropdown.className = "dropdown";
      oldText.textContent = newText.dataset.text;
    }
  });
  dropdownOptions.forEach((option) => {
    option.addEventListener("click", (e) => {
      let selected = e.target;
      newText.dataset.text = selected.textContent;
      dropdownOptions.forEach((option) => option.classList.remove("selected"));
      selected.classList.add("selected");
      savePlace(selected.id);
    });
  });
}

function savePlace(id) {
  setPlace = id;
  window.localStorage.setItem("place", id);
}

function login() {
  $.ajax({
    url: "https://xyzq.ga/login",
    type: "POST",
    datatype: "json",
    data: {
      email: $("#lgnemail").val(),
      password: $("#lgnpassword").val(),
    },
    contentType: "application/x-www-form-urlencoded",
    success: (data) => {
      window.localStorage.setItem("token", data.token);
      window.localStorage.setItem("name", data.name);
      loadUser();
    },
    error: (error) => {
      errorMessage(error.responseText);
    },
  });
}

function register() {
  $.ajax({
    url: "https://xyzq.ga/register",
    type: "POST",
    datatype: "json",
    data: {
      vorname: $("#regvor").val(),
      nachname: $("#regnach").val(),
      email: $("#regemail").val(),
      password: $("#regpassword").val(),
    },
    contentType: "application/x-www-form-urlencoded",
    success: (data) => {
      window.localStorage.setItem("token", data.token);
      loadUser();
    },
    error: (error) => {
      errorMessage(error.responseText);
    },
  });
}

function errorMessage(message) {
  Swal.fire({
    icon: "error",
    title: "Oops...",
    text: message,
  });
}

function logout() {
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("name");
  setTimeout(() => {
    loadUser();
  }, 1000);
}

var prevented = false;

function rate() {
  var token = window.localStorage.getItem("token");
  if (token == null) {
    errorMessage("Bitte logge Sie sich ein");
    return;
  }
  if (!prevented) {
    prevented = true;
    var newValues = [];
    for (var i = 0; i <= 5; i++) {
      newValues[i] = {
        id: $("#rating" + i).attr("name"),
        rate: $("#rating" + i).rate("getValue"),
      };
    }
    newValues = newValues.filter((e) => {
      if (typeof e.rate == "number") {
        return true;
      } else {
        return false;
      }
    });
    if (newValues.length != 0) {
      var clonedValues = JSON.parse(JSON.stringify(newValues));
      newValues.forEach((e, i) => {
        var checkValue = rateSets[setPlace].find((x) => x.id === e.id);
        if (typeof checkValue == "undefined") {
          newValues[i].type = "add";
        } else if (checkValue.rate == e.rate) {
          newValues[i].type == "same";
        } else {
          newValues[i].type = "edit";
          newValues[i].oldRate = checkValue.rate;
        }
      });
      newValues.filter((e) => {
        if (e.type == "same") {
          return false;
        } else {
          return true;
        }
      });
      $.ajax({
        url: "https://xyzq.ga/pushRating",
        type: "POST",
        datatype: "json",
        data: {
          values: JSON.stringify(newValues),
        },
        contentType: "application/x-www-form-urlencoded",
        success: (data) => {
          console.log(data);
          loadAcquired();
          prevented = false;
        },
      });
      rateSets[setPlace] = clonedValues;
      window.localStorage.setItem("rateSets", JSON.stringify(rateSets));
    }
  } else {
    errorMessage("Bitte warten Sie einen Moment");
  }
}
