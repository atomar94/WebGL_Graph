//communicates with the server and routes API calls to respective javascript libraries


//initialize the command parser
function Init_Command_Parser() {
	Init_Plots();

}

//init all plots. currently just thrust is implemented
function Init_Plots() {
	startThrust();
	Poll_Requests();
}

function command_handler(data) {
	var hi = "hi";
}

function request(params) {
	self.parameters = params;
}

function Poll_Requests() {
	mrequest = request("THRUST");

	$.get("/display", "", function(data) {
					command_handler(data);
				});
	
}