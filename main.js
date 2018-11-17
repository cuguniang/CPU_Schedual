

var process = [];//用户输入的进程列表
var scheual_process = [];//用于调度的列表
var schedual_functions = [FCFS,SRTF,RR];
var COLOR = {	
				color:["primary","warning","success","danger","default","info"],
				index:0
			};
var last_colorid = 0;
function Process(process_name,arrival_time,CPU_brust,priority) {
	this.process_name = process_name;
	this.arrival_time = arrival_time;
	this.CPU_brust = CPU_brust;
	this.priority = priority;
	this.remaining_time = CPU_brust;
	this.waiting_time = 0;
	this.start_time = 0;
	this.end_time = 0;
	return this;
}
function Bar(name,start,end,color){//for gantt
	this.name = name;
	this.start = start;
	this.end = end;
	this.color = color;

	return this;
}
function initProcess(){
	for (var i = 0; i < process.length; i++) {
		process[i].waiting_time = 0;
		process[i].remaining_time = process[i].CPU_brust;
	}
}
function deepCopyProcess(){
	for (var i = 0; i < process.length; i++) {
		scheual_process[i] = process[i];
	}
}
function getColor(){
	return COLOR.color[(COLOR.index++)%COLOR.color.length];
}
function updateProcessList() {
	//清除进程列表
	$("#process_table tbody").empty();

	for (var i = 0; i < process.length; i++) {
		var temp = $("<tr></tr>");
		temp.append($("<td></td>").text(i));
		temp.append($("<td></td>").text(process[i].process_name));
		temp.append($("<td></td>").text(process[i].arrival_time));
		temp.append($("<td></td>").text(process[i].CPU_brust));
		temp.append($("<td></td>").text(process[i].priority));
		temp.append($("<td></td>").text(process[i].waiting_time));

		$("#process_table tbody").append(temp);
	}
}
function addProcess() {
	//更新进程数组
	process.push(new Process($("#process_name").val(), 
							parseInt($("#arrival_time").val()), 
							parseInt($("#CPU_brust").val()),
							parseInt($("#priority").val())));

	//清空现在所有进程的等待时间
	initProcess();
	updateProcessList();

	//更新进程列表
	updateProcessList();
}

function clearProcess() {
	//清空进程数组
	process = [];
	scheual_process = [];
	//更新进程列表
	updateProcessList();
}

function schedual(){
	//清空gantt图
	$("#gantt").empty();
	$("#gantt_num").html("<span>0</span>");

	//还原进程的数据：waiting、remainingtime
	initProcess();
	//深拷贝用户输入的进程列表
	deepCopyProcess();	
		
	now_time = 0;
	total_waiting_time = 0;
	
	//获取用户选择的调度算法的序号
	var algorithm = $("#algorithm").val();
	//调用该调度算法对应的function
	schedual_functions[algorithm]();
}

function process_painter(bars,total_brust){
	for(var i = 0;i < bars.length;i++){
		var num = $("<span></span>");
		var bar = $("<div></div>").addClass("progress-bar");

		bar.addClass("progress-bar-"+bars[i].color);//进程颜色
		bar.text(bars[i].name);//进程名字
		bar.css('width',((bars[i].end-bars[i].start)/total_brust*100)+"%");//进程比例
		$("#gantt").append(bar);

		num.text(bars[i].end);
		num.css('width',(bars[i].end-bars[i].start)/total_brust*100-0.5+"%");
		$("#gantt_num").append(num);		
	}
}
$(document).ready(function () {
	$("#btn_add_process").click(addProcess);
	$("#btn_clear_process").click(clearProcess);
	$("#btn_schedual").click(schedual);
});
