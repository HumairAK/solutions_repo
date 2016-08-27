function main(){
    //Constants and Globals
    var MESSAGE_COUNT = 8; // Number of message per page in inbox
    var CURRENT_INBOX_PAGE = 1;

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

    function generatePager(mailCount){
        var pageCount = Math.ceil(mailCount/MESSAGE_COUNT);
        if(pageCount > 1){

            // State current page
            $('#u-pageNumber').empty().append(CURRENT_INBOX_PAGE + ' of ' + pageCount)
                .addClass('u-pagination');


            var $uPager = $("#u-pager");
            $uPager.empty();

            var $pager = $('<div>').addClass('u-pagination');
            $uPager.append($pager);

            var $previous = $("<h5>").append('< Previous')
                .attr('id', 'u-previous')
                .addClass('u-change-page');
            var $next = $("<h5>").append('Next >')
                .attr('id', 'u-next')
                .addClass('u-change-page');

            if(CURRENT_INBOX_PAGE == 1){
                $pager.append($next);
            }else if(CURRENT_INBOX_PAGE == pageCount){
                $pager.append($previous);
            }else{
                $pager.append($previous);
                $pager.append(' | ');
                $pager.append($next);

            }
        }
    }

    function generateInbox(pageNum){
        $.ajax({
            dataType: "json",
            url: '/user/user_profile/inbox/' + MESSAGE_COUNT + '/' + pageNum,
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
                generatePager(mailCount);
            }
        });
    }

    // Hide all pages at load
    hidePages();

    // Show General page
    items[0].show();

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
            case 'u-previous':
                CURRENT_INBOX_PAGE--;
                generateInbox(CURRENT_INBOX_PAGE);
                break;
            case 'u-next':
                CURRENT_INBOX_PAGE++;
                generateInbox(CURRENT_INBOX_PAGE);
                break;
            default:
                console.log('Direction not found');
        }
    });

}

$(document).ready(main);