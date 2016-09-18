function main(){
    // Inbox Constants and Globals
    var INBOX_MESSAGE_COUNT = 8; // Number of message per page in inbox
    var CURRENT_INBOX_PAGE = 1;

    // CommentsConstants and Globals
    var COMMENT_MESSAGE_COUNT = 6; // Number of message per page in comments
    var CURRENT_COMMENT_PAGE = 1;
    var COMMENT_BOX; // {commentCount : int, commentList : array}
    var COMMENT_PAGES = {}; // {pgNum : commentList}
    var COMMENT_COUNT;

    // User-profile dynamic paging
    var items = [
        $("#profile-general"),
        $("#profile-follows"),
        $("#profile-comments"),
        $("#profile-inbox")];

    // Helper functions
    function hidePages(){
        items.forEach(function(item){
            item.hide();
        });
    }

    // Helper functions: Inbox paging

    /* Create the Previous and Next Directional controllers for
     * First calculate the page count, then set up controllers accordingly.
     * Pre-condition: Type takes on values: 'inbox', 'comments'*/
    function generatePager(count, type){
        var currentPage;
        var pageCount;
        var $pageNumber;
        var $uPager;
        var directionType = type;

        if(type == 'inbox'){
            currentPage = CURRENT_INBOX_PAGE;
            pageCount = Math.ceil(count/INBOX_MESSAGE_COUNT);
            $pageNumber = $('#u-inbox-page-number');
            $uPager = $("#u-inbox-pager");
        }else{
            currentPage = CURRENT_COMMENT_PAGE;
            pageCount = Math.ceil(count/COMMENT_MESSAGE_COUNT);
            $pageNumber = $('#u-comment-page-number');
            $uPager = $("#u-comment-pager");
        }

        if(pageCount > 1){

            // State current page
            $pageNumber.empty().append(currentPage + ' of ' + pageCount)
                .addClass('u-pagination');


            $uPager.empty();

            var $pager = $('<div>').addClass('u-pagination');
            $uPager.append($pager);

            var $previous = $("<h5>").append('< Previous')
                .attr('id', 'u-previous-' + directionType)
                .addClass('u-change-page');
            var $next = $("<h5>").append('Next >')
                .attr('id', 'u-next-' + directionType)
                .addClass('u-change-page');

            if(currentPage == 1){
                $pager.append($next);
            }else if(currentPage == pageCount){
                $pager.append($previous);
            }else{
                $pager.append($previous);
                $pager.append(' | ');
                $pager.append($next);
            }
        }
    }

    /* Request inbox from server, then create inbox in DOM, call generatePager */
    function generateInbox(pageNum){
        $.ajax({
            dataType: "json",
            url: '/user/user_profile/inbox/' + INBOX_MESSAGE_COUNT + '/' + pageNum,
            success: function(mailbox){


                var inbox = mailbox.mail;
                var mailCount = mailbox.mailCount;
                var uInboxCount =  $('#u-inbox-count');

                uInboxCount.empty().append('You have ' + mailCount
                    + ' messages in your inbox.');

                // For inbox table body
                var $InboxBody = $('#u-inbox-body');

                // For table modal op up windows
                var $InboxContainer = $('#u-inbox-container');

                $InboxBody.empty();

                var windowCounter = 0;
                inbox.forEach(function(message){

                    //create row
                    var $row = $('<tr>');
                    $row.addClass('u-table-row');
                    $row.attr('data-toggle', 'modal');
                    $row.attr('data-target', '#popup' + windowCounter);
                    $row.attr('type', 'button');

                    //create cells in row
                    var $date = $('<td>').text(message.date);
                    var $subject = $('<td>').text(message.subject);
                    var $sender = $('<td>').text(message.sender);

                    //append cells to row
                    $row.append($date);
                    $row.append($subject);
                    $row.append($sender);


                    //append row to body
                    $InboxBody.append($row);

                    //Create modal pop up
                    var $modalFade = $('<article>')
                        .addClass('modal')
                        .addClass('fade')
                        .attr('id', 'popup' + String(windowCounter));
                    var $modalDialog = $('<div>').addClass('modal-dialog');
                    var $modalContent = $('<div>').addClass('modal-content');
                    var $modalHeader = $('<section>').addClass('modal-header');
                    var $modalButton = $('<button>')
                        .addClass('close')
                        .attr('type', 'button')
                        .attr('data-dismiss', 'modal');


                    var $modalTitle = $('<h4>')
                        .addClass('modal-title');
                    var $emphasisSubject = $('<em>').text('Subject: ');

                    var $headerFrom = $('<h5>');
                    var $emphasisFrom = $('<em>').text('From: ');
                    var $emphasisDate = $('<em>').text('Date: ');

                    var $modalBody = $('<section>');
                    var $modalFooter = $('<div>').addClass('modal-footer');

                    $InboxContainer.append($modalFade);
                    $modalFade.append($modalDialog);
                    $modalDialog.append($modalContent);
                    $modalContent.append($modalHeader);
                    $modalContent.append($modalBody);
                    $modalContent.append($modalFooter);

                    $modalButton.append('&times;');

                    $modalTitle.append($emphasisSubject);
                    $modalTitle.append(message.subject);

                    $headerFrom.append($emphasisFrom);
                    $headerFrom.append(message.sender);

                    $emphasisDate.text('Date: ');

                    $modalHeader.append($modalButton);
                    $modalHeader.append($modalTitle);
                    $modalHeader.append($headerFrom);
                    $modalHeader.append($emphasisDate);
                    $modalHeader.append(message.date);

                    $modalBody.append(message.message);

                    windowCounter++;
                });

                // Generate Pager
                generatePager(mailCount, 'inbox');
            }
        });
    }

    /* Request comment history for user from server, call create comments */
    function generateComments(pageNum){
        $.ajax({
            dataType: "json",
            url: '/user/user_profile/comments/' + COMMENT_MESSAGE_COUNT + '/' + pageNum,
            success: function(commentbox){
                COMMENT_BOX = commentbox; // Load comments into box
                COMMENT_COUNT = commentbox.commentCount;
                commentPageCreation();
            }
        });
    }

    /* Create comment DOM elements */
    function createCommentDOM(){
        var commentList = COMMENT_PAGES['page_' + CURRENT_COMMENT_PAGE];
        var $commentContainer = $('#u-comment-container');
        $commentContainer.empty();

        // If Page does not exist add an error prompt in DOM
        if(!commentList){
            var $pageNotFound = $('<h5>').text('Page does not Exist');
            $commentContainer.append($pageNotFound);
            return
        }

        commentList.forEach(function(comment){
            // Parse date:
            var date = comment.date.split(' ');
            var datePrint = date[0] + ' ' + date[1] + ' ' + date[2];

            var $commentContent = $('<div>').addClass('u-comment-block');
            var $date = $('<h6>').text(datePrint + ', ').addClass('u-comment-elem');
            var $course = $('<h6>').text(comment.course_code+ ', ').addClass('u-comment-elem');
            var $term = $('<h6>').text(comment.term+ ', ').addClass('u-comment-elem');
            var $year = $('<h6>').text(comment.year).addClass('u-comment-elem');
            var $comment= $('<em>').text(comment.comment).addClass('u-comment-style');

            $commentContent.append($course).append($date).append($term).append($year).append($('<p>').append($comment));
            $commentContainer.append($commentContent);

            generatePager(COMMENT_COUNT, 'comments');
        });
    }

    /* Set up Comment Pages attribute for comment DOM creation*/
    function commentPageCreation(){
        console.log('in comment creation');
        var commentCount = COMMENT_BOX.commentCount;
        var commentList = COMMENT_BOX.commentList;
        var pageCount = Math.ceil(commentCount/COMMENT_MESSAGE_COUNT);

        console.log('CommentCount: ' + commentCount);
        console.log('pageCount: ' + pageCount);


        //Sort comments by ascended order
        commentList.sort(function(a,b){
            return new Date(a.date).getTime() - new Date(b.date).getTime()
        });

        // For each page
        for(var i = 1; i <= pageCount; i++){
            COMMENT_PAGES[('page_' + i)] = [];
            // Create 10 rows for comments or until max length is reached
            var j = 1;
            while((j <= COMMENT_MESSAGE_COUNT) && (commentList.length > 0)){
                COMMENT_PAGES[('page_' + i)].push(commentList.pop());
                j++;
            }
        }

        // Create commentDom
        createCommentDOM();
        //console.log(COMMENT_PAGES);
    }

    // Hide all pages at load
    hidePages();

    // Show General page
    items[0].show();

    // Navigate pages in profile (i.e. profile, comments, follows, inbox, etc.)
    $('.nav-o').bind('click', function(e){

        e.preventDefault();
        hidePages();

        /* Each case will need to be changed to call a handler for fetching data
         * from server*/
        switch($(this).attr('id')) {
            case "nav-profile":
                console.log("clicked general");
                $("#profile-general").show();
                break;
            case "nav-follows":
                $("#profile-follows").show();
                break;
            case "nav-comments":
                $("#profile-comments").show();
                generateComments(CURRENT_COMMENT_PAGE);
                break;
            case "nav-inbox":
                $("#profile-inbox").show();
                generateInbox(1); // generate inbox messages for page 1
                break;
            default:
                console.log("Error: User page not found");
        }
    });

    // Inbox Pager (Located at bottom of inbox in html)
    $('.u-main').on('click', 'h5.u-change-page', function(){
        console.log('clicked');
        var direction = $(this).attr('id');

        switch(direction){
            case 'u-previous-inbox':
                CURRENT_INBOX_PAGE--;
                generateInbox(CURRENT_INBOX_PAGE);
                break;
            case 'u-next-inbox':
                CURRENT_INBOX_PAGE++;
                generateInbox(CURRENT_INBOX_PAGE);
                break;
            case 'u-previous-comments':
                CURRENT_COMMENT_PAGE--;
                createCommentDOM();
                break;
            case 'u-next-comments':
                CURRENT_COMMENT_PAGE++;
                createCommentDOM();
                break;

            default:
                console.log('Direction not found');
        }
    });

}

$(document).ready(main);