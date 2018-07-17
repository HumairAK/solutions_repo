# Solutions.Repo

A web app that allows students to view and share test/exam solutions. The app is currently designed for U of T students with
plans of making it available to students in universities all over the world.

## Installation

### Heroku
In order to the use the live version of the application deployed on Heroku simply go to the following url on your browser:
https://solutionsrepo.herokuapp.com/

### Github
In order to run the web app locally from your computer please follow the following steps:

1. Clone the repository into your desired directory from: https://github.com/HumairAK/solutions_repo
2. Make sure node.js and npm are installed on your computer. If not, the easiest way to do this is using Homebrew.
3. Run: npm install from the root directory
4. Run: NODE_ENV=staging node app.js to run the server
5. Open the browser to http://localhost:3000/

## Usage and Features

### General user (not signed in)

#### Examination + Solution Search

1. Go to the main page, and search for the course code of the examination you would like to search in the search bar. Make sure the "Courses" option is selected in the search dropdown.
2. Select an exam from the search results page.
3. You will see a list of all the questions in the selected exam, as well as the number of solutions each one of them has. You can click on the items in the list to view the solutions.

##### Voting

Once in the solutions page you can promote solutions by clicking the green "up" arrow or dislike it by clicking the red "down" arrow.


#### User Search
1. Select the "User" option from the search dropdown on the Main page
2. Select a user from the search results. If the user does not exist, the search results are usually empty.

### Signed In User

In order to be able to add solutions or comment, you must be have an account. You can create an account using the site, or signin with your Facebook account.

#### Add solution

In order to add a solution, simply navigate to the solutions page (walk through in Examination + Solution Search section), and click on the "Add a solution" button.

#### Add a comment

You can add comments in the solutions page, where you can ask for more clarifications on specific questions.

#### Profile + Social Media

In your profile, you can see the exams you are following, as well as messages you receive in the Inbox section.

### Admin User

Admin users can only be added by existing admin users. Once added as an admin you have all the privileges as
a signed in user along with the following (accessed in the Admin panel):

* Add an exam
* Add a course
* Add an Admin
* Remove an Exam
* Remove a Course
* Remove a User

## Built With

* Server-Side: Node.js, Express
* Client-side: Javascript/jQuery, Handlebars, Bootstrap, HTML5/CSS3
* Database: MongoDB

## Authors
* Nana Nosirova
* Humair Khan
* Kumar Damani
* Waref Haque
