# solutions_repo  
A web app that allows students to view and share test/exam solutions. The app is currently designed for U of T students with
plans of making it available to students in universities all over the world.
  
  
#installation

    Heroku-
    In order to the use the live version of the application deployed on Heroku simply go to the following url on your browser:
    http://frozen-springs-49303.herokuapp.com/

    GitHub-
    In order to run the web app locally from your computer please follow the following steps:
        1. Clone the repository into your desired directory from: https://github.com/HumairAK/solutions_repo
        2. Make sure node.js and npm are installed on your computer. If not, the easiest way to do this is using Homebrew. Please
           follow the following steps to install Homebrew + node + npm:
                1. Run: ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" from a
                   directory of your choosing.
                2. Run: brew update to get the most updated version
                3. Run: brew install node to install node and npm simultaneously.

        3. Run: npm install from the root directory
        4. Run: node ./bin/www.js to run the server
        5. Open the browser to http://localhost:3000/

Usage and features:

    General user (not signed in):

        Examination + Solution Search:

           1. Type in the course code in the search bar saying: "Enter course name".
           2. Make sure the "Courses" option is selected to the left of the search bar.
           3. Select the examination the from the list provided
           4. Select the questions you wish to view from the list provided. Each question has the number of solutions
              and comments that other users have posted.
           5. Once in the solutions page, you can view the solutions but in order to post a solution or comment you must
              be signed in.

            Voting:

               Once in the solutions page you can promote solutions by clicking the green "up" arrow or dislike it by
               clicking the red "down" arrow.

        User Search:

            1. Select the "Users" option on the left side of the search bar in the home page.
            2. Select the user's profile you wish to view.


    Signed In User:

        In order to sign in and take advantage of commenting and adding solutions you must sign in via your facebook account.

        Examination + Solution Search:
            Add Solution:

                1. Once in the solutions page click "Add a solution"
                2. Type in your solution in the form and hit "Submit"

            Add Comment:

                1. Once in the solutions page click "Comment"
                2. Type in your comment in the form and hit "Submit"


        Profile + Social Media:
            In your profile page you can see the users you are following in the "Following" tab and you can see the friends
            you have in the "Friends" tab. You can also see the messages you have received in "Inbox" and the comments
            you have made in "Comments". Please follow the following steps to friend a user, message a user or follow a
            user:
                Follow an exam:

                    1. Once signed in search for the course you wish to see the exam for and select and exam of your choice
                    2. Click the "Follow Exam" button once in the page displaying the list of questions for an exam


                Message a user:

                    1. Once signed in click on the "PROFILE PAGE" at the top of any of the pages
                    2. Click "Send Message"
                    3. Fill in the forms: "Send To:" must contain the username of the person you are trying to reach
                                          "Subject:" is the subject of your message
                                          "Message:" contains your message in text
                    4. Once the forms are filled out press "Send Message"


    Admin User:

        Admin users can only be added by existing admin users. Once added as an admin you have all the privileges as
        a signed in user along with the following:

        Click on the "Admin Panel" to access these features

            Add an Exam:
                Once in the admin panel fill out the necessary details in the "Add Exam" tab and press "Submit"
            Add a Course:
                Once in the admin panel fill out the necessary details in the "Add Course" tab and press "Submit"
            Add another Admin:
                Once in the admin panel fill out the necessary details in the "Add Admin" tab and press "Submit"
            Remove an Exam:
                Once in the admin panel fill out the necessary details in the "Remove Exam" tab and press "Submit"
            Remove a Course:
                Once in the admin panel fill out the necessary details in the "Remove Course" tab and press "Submit"
            Remove a User:
                Once in the admin panel fill out the necessary details in the "Remove User" tab and press "Submit"
