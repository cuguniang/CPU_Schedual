/**
 * @author: Wang Ping
 * @version: 1.0.5
 */

var now_time = 0; // 当前时刻
var total_waiting_time = 0; // 总等待时间
var bars = [] // for gantt
function FCFS() {

	// 按arrival_time排序
	schedual_process.sort(function (a, b) {
		return a.arrival_time - b.arrival_time;
	})

	bars = [];

	// 实现调度
	now_time = 0;
	for (var i = 0; i < schedual_process.length; i++) {
		var p = schedual_process[i]; // 该进程
		if (p.arrival_time > now_time) {
			bars.push(new Bar('free', now_time, p.arrival_time, 'free'))
			now_time = p.arrival_time;
		}
		p.start_time = now_time;
		bars.push(new Bar(p.process_name, p.start_time, p.start_time + p.CPU_brust, getColor()));
		p.waiting_time = p.start_time - p.arrival_time;

		now_time += p.CPU_brust;
	}

	// 画gantt图
	process_painter(bars, now_time)

	// 在进程列表中更新它们的等待时间
	updateProcessList()

	// 计算并显示平均等待时间
	cal_avg_waiting_time()
}

function SRTF() {
	schedual_process.sort(function (a, b) {
		// 到达时间一样，短作业优先
		if (a.arrival_time == b.arrival_time) {
			return a.CPU_brust - b.CPU_brust;
		}
		// 否则按到达时间排序
		return a.arrival_time - b.arrival_time;
	});

	bars = [];
	var ready_queue = []; // 就绪队列

	var now_p = null;

	while (schedual_process.length > 0 || ready_queue.length > 0) {
		var next_p = schedual_process[0]; // 即将到达的进程
		// CPU空闲
		if (now_p == null) {
			if (next_p.arrival_time != 0) bars.push(new Bar('free', now_time, next_p.arrival_time, 'free'))
			now_time = next_p.arrival_time;
			ready_queue.push(next_p);
			now_p = next_p;
			now_p.start_time = now_time;
			moveProcess(next_p, schedual_process, null);
		}
		// now_p结束时next_p还未到达
		else if (next_p == null || now_time + now_p.remaining_time < next_p.arrival_time) {
			// 画now_p
			bars.push(new Bar(now_p.process_name, now_time, now_time + now_p.remaining_time, getColor()));

			now_time += now_p.remaining_time
			moveProcess(now_p, ready_queue, null);

			// 如果ready_queue中已经没有进程了
			if (ready_queue.length == 0) {
				now_p = null;
			} else {
				now_p = getShortest(ready_queue)
				if (now_p.CPU_brust == now_p.remaining_time) { // 第一次执行到它
					now_p.start_time = now_time;
					now_p.waiting_time += now_p.start_time - now_p.arrival_time;
				} else {
					now_p.waiting_time = now_time - (now_p.end_time - now_p.start_time);
					now_p.start_time = now_time;
				}
			}
		}
		// 刚好在结束时到达
		else if (now_time + now_p.remaining_time == next_p.arrival_time) {
			bars.push(new Bar(now_p.process_name, now_time, now_time + now_p.remaining_time, getColor()));
			moveProcess(now_p, ready_queue, null);
			moveProcess(next_p, schedual_process, ready_queue);

			now_time += now_p.remaining_time;
			now_p = getShortest(ready_queue);

			if (now_p.CPU_brust == now_p.remaining_time) { // 第一次执行到它
				now_p.start_time = now_time;
				now_p.waiting_time += now_p.start_time - now_p.arrival_time;
			} else {
				now_p.waiting_time = now_time - (now_p.end_time - now_p.start_time);
				now_p.start_time = now_time;
			}
		}
		// 未结束时到达，可能抢占
		else if (now_time + now_p.remaining_time > next_p.arrival_time) {
			// 计算next_p到达时刻，now_p的剩余时间
			now_p.remaining_time -= next_p.arrival_time - now_time;
			moveProcess(next_p, schedual_process, ready_queue);

			// 抢占
			if (now_p.remaining_time > next_p.remaining_time) {

				// 画now_p
				bars.push(new Bar(now_p.process_name, now_time, next_p.arrival_time, getColor()));

				now_time = next_p.arrival_time;

				now_p.end_time = now_time;

				now_p = next_p;

				now_p.start_time = now_time;
			}
			// 无法抢占
			else {
				// 恢复remaining_time
				now_p.remaining_time += next_p.arrival_time - now_time;
			}
		} else {
			console.log('应该没这种情况啊');
		}
	}
	// 画gantt图
	process_painter(bars, now_time);

	// 在进程列表中更新它们的等待时间
	updateProcessList();

	// 计算并显示平均等待时间
	cal_avg_waiting_time();
}

function RR() {

	// 按arrival_time排序，如果arrival_time相同，相对位置不变
	schedual_process.sort(function (a, b) {
		return a.arrival_time - b.arrival_time;
	});

	bars = []; // for gantt
	var time_q = 3; // 时间片

	// 轮询，直到所有进程都执行完
	while (schedual_process.length) {
		for (var i = 0; i < schedual_process.length; i++) {
			var p = schedual_process[i]; // 该进程

			// 此时CPU空闲没有进程到达,增加一段空闲bar
			if (p.arrival_time > now_time) {
				bars.push(new Bar('free', now_time, p.arrival_time, 'free'));
				now_time = p.arrival_time;
			}

			// 计算当前进程本次执行前的等待时间
			if (p.CPU_brust == p.remaining_time) { // 第一次执行到它
				p.start_time = now_time;
				p.waiting_time += p.start_time - p.arrival_time; // 执行-到达
			} else {
				p.waiting_time += now_time - (p.start_time + time_q); // 执行-上次执行完
				p.start_time = now_time;
			}

			// 执行本次调度
			if (p.remaining_time > time_q) { // 剩余时间大于时间片
				p.remaining_time -= time_q;
				bars.push(new Bar(p.process_name, now_time, now_time + time_q, getColor()));
				now_time += time_q; // 执行完了
			} else {
				bars.push(new Bar(p.process_name, now_time, now_time + p.remaining_time, getColor()));
				now_time += p.remaining_time; // 执行完了
				p.remaining_time = 0;
			}
			if (p.remaining_time == 0) schedual_process.splice(i--, 1); // 进程已经终止，从数组中移除该进程
		}
	}

	// 画gantt图
	process_painter(bars, now_time);

	// 在进程列表中更新它们的等待时间
	updateProcessList();

	// 计算并显示平均等待时间
	cal_avg_waiting_time();
}

function Priority() {
	schedual_process.sort(function (a, b) {
		// 到达时间一样，优先级高的优先
		if (a.arrival_time == b.arrival_time) {
			return a.priority - b.priority;
		}
		// 否则按到达时间排序
		return a.arrival_time - b.arrival_time;
	});

	bars = [];
	var ready_queue = []; // 就绪队列

	var now_p = null;

	while (schedual_process.length > 0 || ready_queue.length > 0) {
		var next_p = schedual_process[0]; // 即将到达的进程
		// CPU空闲
		if (now_p == null) {
			if (next_p.arrival_time != 0) bars.push(new Bar('free', now_time, next_p.arrival_time, 'free'));
			now_time = next_p.arrival_time;
			now_p = next_p;
			now_p.start_time = now_time;

			moveProcess(next_p,schedual_process,ready_queue);
		}
		// now_p结束时next_p还未到达
		else if (next_p == null || now_time + now_p.remaining_time < next_p.arrival_time) {
			// 画now_p
			bars.push(new Bar(now_p.process_name, now_time, now_time + now_p.remaining_time, getColor()));

			now_time += now_p.remaining_time;
			moveProcess(now_p,ready_queue,null);

			// 如果ready_queue中已经没有进程了
			if (ready_queue.length == 0) {
				now_p = null;
			} else {
				now_p = getHighestPriority(ready_queue)
				if (now_p.CPU_brust == now_p.remaining_time) { // 第一次执行到它
					now_p.start_time = now_time;
					now_p.waiting_time += now_p.start_time - now_p.arrival_time;
				} else {
					now_p.waiting_time = now_time - (now_p.end_time - now_p.start_time);
					now_p.start_time = now_time;
				}
			}
		}
		// 刚好在结束时到达
		else if (now_time + now_p.remaining_time == next_p.arrival_time) {
			bars.push(new Bar(now_p.process_name, now_time, now_time + now_p.remaining_time, getColor()));
			moveProcess(now_p,ready_queue,null);
			moveProcess(next_p,schedual_process,ready_queue);

			now_time += now_p.remaining_time;
			now_p = getHighestPriority(ready_queue);

			if (now_p.CPU_brust == now_p.remaining_time) { // 第一次执行到它
				now_p.start_time = now_time;
				now_p.waiting_time += now_p.start_time - now_p.arrival_time;
			} else {
				now_p.waiting_time = now_time - (now_p.end_time - now_p.start_time);
				now_p.start_time = now_time;
			}
		}
		// 未结束时到达，可能抢占
		else if (now_time + now_p.remaining_time > next_p.arrival_time) {
			// 抢占
			if (now_p.priority > next_p.priority) {

				// 画now_p
				bars.push(new Bar(now_p.process_name, now_time, next_p.arrival_time, getColor()));

				// 计算next_p到达时刻，now_p的剩余时间
				now_p.remaining_time -= next_p.arrival_time - now_time;

				now_time = next_p.arrival_time;

				now_p.end_time = now_time;

				now_p = next_p;

				now_p.start_time = now_time;
			}	
			
			//不管是否抢占，加入ready_queue
			moveProcess(next_p, schedual_process, ready_queue);
		} else {
			console.log('应该没这种情况啊');
		}
	}
	// 画gantt图
	process_painter(bars, now_time);

	// 在进程列表中更新它们的等待时间
	updateProcessList();

	// 计算并显示平均等待时间
	cal_avg_waiting_time();
}

function cal_avg_waiting_time() { // 计算平均等待时间

	for (var i = 0; i < process.length; i++) {
		total_waiting_time += process[i].waiting_time
	}
	$('#avg_waiting_time').text(total_waiting_time / process.length)
}

function getShortest(ready_queue) {
	ready_queue.sort(function (a, b) {
		return a.remaining_time - b.remaining_time;
	});
	return ready_queue[0];
}

function getHighestPriority(ready_queue) {
	ready_queue.sort(function (a, b) {
		return a.priority - b.priority;
	});
	return ready_queue[0];
}

function moveProcess(p, old_queue, new_queue) { //从old_queue中删掉p，从new_queue中添加p
	if (old_queue) old_queue.splice(old_queue.indexOf(p), 1);
	if (new_queue) new_queue.push(p);
}