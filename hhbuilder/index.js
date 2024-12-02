document.addEventListener("DOMContentLoaded", function () {
    var householdList = document.querySelector(".household");
    var ageInput = document.getElementById("age");
    var relationshipInput = document.getElementById("rel");
    var smokerInput = document.getElementById("smoker");
    var addButton = document.querySelector(".add");
    var form = document.querySelector("form");
    var household = [];

    function renderHouseholdList() {
        householdList.innerHTML = "";
        household.forEach(function (member, index) {
            var listItem = document.createElement("li");
            listItem.textContent = `Age: ${member.age}, Relationship: ${member.relationship}, Smoker: ${member.smoker ? "Yes" : "No"}`;
            var removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", function () {
                household.splice(index, 1);
                renderHouseholdList();
            });
            listItem.appendChild(removeButton);
            householdList.appendChild(listItem);
        });

        printSerializedJson();
    }

    function validateForm() {
        var age = parseInt(ageInput.value, 10);
        var relationship = relationshipInput.value;

        if (!age || age <= 0) {
            alert("Age must be greater than 0");
            ageInput.focus();
            return false;
        }

        if (!relationship) {
            alert("Relationship is a required field");
            relationshipInput.focus();
            return false;
        }

        return true;
    }

    function addHouseholdMember() {
        if (!validateForm()) return;

        var member = {
            age: parseInt(ageInput.value, 10), //Rounds to nearest whole number
            relationship: relationshipInput.value,
            smoker: smokerInput.checked,
        };

        household.push(member);
        renderHouseholdList();

        form.reset();
        ageInput.focus();
    }
    
    function printSerializedJson() {
        var debugOutput = document.querySelector(".debug");
        debugOutput.textContent = JSON.stringify(household, null, 2);
        debugOutput.style.display = "block";
    }

    addButton.addEventListener("click", function (event) {
        event.preventDefault(); 
        addHouseholdMember();
        printSerializedJson();
    });

});

