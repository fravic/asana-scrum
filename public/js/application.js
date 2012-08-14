function _Application() {

    var APP_URL = "https://app.asana.com/0";
    var API_URL = ".";
    var AUTH_URL = "./auth";

    var RELOAD_TIME = 900000;
    var COOKIE_NAME = "scrumKey";

    var _users = {};
    var _selectedUsers = [];
    var _currentWorkspace;
    var _apiKey;

    /* Async functions */

    function apiCall(url, callback, data) {
        $.ajax({
            type: "GET",
            url: API_URL + url,
            contentType: "application/json",
            data: data,
            success: callback
        });
    }

    function apiError(e) {
        createCookie(COOKIE_NAME, '', 0);
        $("#authMessage").html("Please re-enter your API key:");
        $("#auth").fadeIn("fast");
    }

    function authCall(authKey, callback) {
        $.ajax({
            type: "GET",
            url: AUTH_URL,
            data: {auth: authKey},
            success: callback,
            error: apiError
        });
    }

    function makeBaseAuth(user, pass) {
        var tok = user + ':' + pass;
        var hash = Base64.encode(tok);
        return "Basic " + hash;
    }

    function loadUserList(data) {
        console.log(data);
        if (!data) {
            // Assume an api error
            return apiError();
        }

        apiCall('/users', receiveUserData,
                {opt_fields:"name,workspaces"});
    }

    function loadUserScrum(userId) {
        apiCall('/tasks', receiveUserScrum,
                {
                    workspace:_currentWorkspace,
                    assignee:userId,
                    opt_fields: "name,assignee,assignee_status,completed,completed_at"
                });
    }

    /* Data receipt */

    function receiveUserData(data) {
        var users = data["data"];

        users.sort(function(a, b) {
            var nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            else if (nameA > nameB) return 1;
            return 0;
        });

        $.each(users, function(idx, user) {
            addUserToPeopleList(user);
        });
    }

    function receiveUserScrum(data) {
        var tasks = data["data"];

        $.each($.grep(tasks, function(task) {
            var completedAt = new Date(task.completed_at);
            return (!task.completed && task.assignee_status == "today") ||
                (task.completed && completedAt.toDateString() == (new Date()).toDateString());
        }), function(idx, task) {
            addTodayTask(task, idx, task.completed);
        });

        $.each($.grep(tasks, function(task) {
            var yesterday = new Date(), completedAt;
            yesterday.setDate(yesterday.getDate() - 1);
            completedAt = new Date(task.completed_at);
            return task.completed && completedAt.toDateString() == yesterday.toDateString();
        }), function(idx, task) {
            addYesterdayTask(task, idx);
        });

        reWookmark();
    }

    /* DOM Manipulation */

    function reWookmark() {
        $("#content .scrumBox").wookmark({container: $("#content"), offset: 15});
    }

    function createScrumBoxForUser(userId) {
        var scrumBox = $("#includes .scrumBox").clone();
        scrumBox.attr("id", "scrumBox" + userId);
        $(".title H2", scrumBox).html(_users[userId].name);
        $("#content").append(scrumBox);
        reWookmark();
    }

    function removeScrumBoxForUser(userId) {
        $("#scrumBox" + userId).remove();
        reWookmark();
    }

    function addToTaskList(taskList, task, idx, done) {
        var li = $("<LI>");
        var url = APP_URL + "/" + task.assignee.id + "/" + task.id;
        li.html(task.name);
        taskList.append(li);

        if (idx % 2) {
            li.addClass("odd");
        }
        if (done) {
            li.addClass("done");
        }

        li.mouseover(function() {
            li.addClass("over");
        });
        li.mouseout(function() {
            li.removeClass("over");
        });
        li.click(function() {
            window.open(url, "_blank");
        });
    }

    function addYesterdayTask(task, idx) {
        var scrumBox = $("#scrumBox" + task.assignee.id);
        addToTaskList($(".yesterday .taskList", scrumBox), task, idx);
    }

    function addTodayTask(task, idx, done) {
        var scrumBox = $("#scrumBox" + task.assignee.id);
        addToTaskList($(".today .taskList", scrumBox), task, idx, done);
    }

    function addUserToPeopleList(user) {
        var list = $("#peopleList");
        var link = $("<LI>");
        var check = $("<INPUT>");

        _users[user.id] = user;

        check.attr("type", "checkbox");
        link.append(check);

        function checkClicked() {
            if ($("#scrumBox" + user.id).empty()) {
                _currentWorkspace = user.workspaces[0].id;
                createScrumBoxForUser(user.id);
                loadUserScrum(user.id);

                if (_selectedUsers.indexOf(user.id) < 0) {
                    _selectedUsers.push(user.id);
                    rehashSelectedUsers();
                }
            }
        }

        function checkUnclicked() {
            removeScrumBoxForUser(user.id);
            _selectedUsers.splice(_selectedUsers.indexOf(user.id));
            rehashSelectedUsers();
        }

        check.click(function() {
            if (check.attr("checked")) {
                checkClicked();
            } else {
                checkUnclicked();
            }
        });
        link.append(user.name);
        list.append(link);

        if (_selectedUsers.indexOf(user.id) >= 0) {
            check.attr("checked", true);
            checkClicked();
        }
    }

    function rehashSelectedUsers() {
        window.location.hash = _selectedUsers.join("&");
    }

    function timedReload() {
        window.location.reload();
    }

    function auth() {
        createCookie(COOKIE_NAME, $("#authForm INPUT").val(), 0);
        $("#auth").fadeOut("fast");
        authCall($("#authForm INPUT").val(), loadUserList);
        return false;
    }

    function onLoad() {
        var userHash = window.location.hash.slice(1);
        if (userHash.length > 0) {
            userHash = userHash.split("&");
            $.each(userHash, function(idx, user) {
                _selectedUsers.push(parseInt(user));
            });
        }

        setTimeout(timedReload, RELOAD_TIME);

        if (_apiKey = readCookie(COOKIE_NAME)) {
            $("#auth").hide();
            loadUserList();
        }
        $("#authForm").submit(auth);
    }

    $(document).ready(onLoad);
};

var Application = new _Application();