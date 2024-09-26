import axios from "axios";
import { API } from "./api.js";
import { delay, logDelay, getRandomUserAgent, log } from "../config/helpers.js";
import { getGameData } from "../config/encrypt.js"

export class GamesAPI extends API {
    constructor(moonbix) {
        super();

        this.proxy = moonbix.proxy;
        this.account_name = moonbix.account_name;
        this.access_token = moonbix.access_token;
        this.game_ticket = moonbix.game_ticket;
        this.tasks = null;
        this.game_response = null;
        this.game_data = null;
        this.game_traps = [];
        this.base_url = "https://www.binance.com/bapi/growth/v1";
    }

    async startCompleteTasks() {
        await this.getTaskList();

        //? Skip task if resourceId is 2058
        const uncompletedTasks = this.tasks.filter(
            (resourceId) => resourceId !== 2058
        );

        //? If no incomplete tasks found, log info
        if (!uncompletedTasks || uncompletedTasks.length === 0) {
            await logDelay(
                `🃏 Nhiệm vụ: Không có nhiệm vụ nào chưa hoàn thành`,
                1000,
                this.account_name,
                "warning"
            );
            return;
        }

        await logDelay(
            `🃏 Nhiệm vụ: Bắt đầu hoàn thành nhiệm vụ`,
            1000,
            this.account_name,
            "info"
        );

        //? Iterate through the task uncompletedTasks to complete them
        for (const resourceId of uncompletedTasks) {
            const success = await this.postCompleteTask(resourceId);

            if (success) {
                if (resourceId == 2057) {
                    await logDelay(
                        `🃏 Nhiệm vụ: Đăng ký thành công`,
                        2000,
                        this.account_name,
                        "custom"
                    );
                } else {
                    await logDelay(
                        `🃏 Nhiệm vụ: Hoàn thành nhiệm vụ - ${resourceId}`,
                        2000,
                        this.account_name,
                        "success"
                    );
                }
            } else {
                await logDelay(
                    `🃏 Nhiệm vụ: Nhiệm vụ chưa hoàn thành - ${resourceId}`,
                    2000,
                    this.account_name,
                    "error"
                );
            }

            // Thêm độ trễ 3 giây giữa các tác vụ bằng tính năng ghi nhật ký
            await logDelay(
                `🤖 BOT: Ngủ sau 3 giây`,
                3000,
                this.account_name,
                "warning"
            );
        }
    }

    async getTaskList() {
        return this.retryApiCall(
            async() => await this.runGetTaskList(),
            3, // số lần thử lại tối đa
            1000, // độ trễ giữa các lần thử lại
            this.account_name // account name for logging
        );
    }

    async runGetTaskList() {
        await logDelay(
            `🃏 Nhiệm vụ: Tìm nạp các tác vụ API`,
            1000,
            this.account_name,
            "info"
        );
        const url = `${this.base_url}/friendly/growth-paas/mini-app-activity/third-party/task/list`;

        const data = await this.fetch(url, "POST", this.access_token, {
            resourceId: 2056,
        });

        if (data.code !== "000000" || !data.success) {
            throw new Error(`🤖 Không thể lấy danh sách nhiệm vụ: ${data.message}`);
        }


        //? Trích xuất danh sách nhiệm vụ
        const taskList = data?.data?.data[0]?.taskList?.data || [];

        //? Trả về ResourceId của các tác vụ chưa hoàn thành
        const filteredTask = taskList
            .filter((task) => (task.type === 'LOGIN' && task.status === 'IN_PROGRESS') || task.completedCount === 0)
            .map((task) => task.resourceId);

        this.tasks = filteredTask;

        return data;
    }

    async postCompleteTask(resourceId) {
        try {

            if (resourceId == 2057) {

                await logDelay(
                    `🃏 Nhiệm vụ: Cố gắng đăng ký`,
                    1000,
                    this.account_name,
                    "custom"
                );
            } else {
                await logDelay(
                    `🃏 Nhiệm vụ: Bắt đầu nhiệm vụ - ${resourceId}`,
                    1000,
                    this.account_name,
                    "info"
                );
            }
            const url = `${this.base_url}/friendly/growth-paas/mini-app-activity/third-party/task/complete`;

            const data = await this.fetch(url, "POST", this.access_token, {
                resourceIdList: [resourceId],
                referralCode: null,
            });

            if (data.code !== "000000" || !data.success) {
                throw new Error(`⚠️ Không thể hoàn thành nhiệm vụ: ${data.message}`);
            }

            return data.success
        } catch (error) {
            throw new Error(`⚠️ Lỗi hoàn thành nhiệm vụ: ${error.message}`);
        }
    }

    //* ------------------------------------------------------------------------------ *//

    async autoPlayGame() {
        while (this.game_ticket > 0) {
            await delay(1000);
            if (await this.startGame()) {
                const { score, encryptedPayload } = getGameData(this.game_response)
                if (encryptedPayload) {
                    await logDelay(
                        `🎯 Trò chơi: Chơi trò chơi trong 45 giây`,
                        60000,
                        this.account_name,
                        "info"
                    );
                    if (await this.completeGame(encryptedPayload, score)) {
                        this.game_ticket -= 1;
                        await logDelay(
                            `🎯 Trò chơi: Số vé còn lại: ${this.game_ticket}/6`,
                            1000,
                            this.account_name,
                            "warning"
                        );
                    } else {
                        await logDelay(
                            `🎯 Trò chơi: Không thể hoàn thành trò chơi`,
                            1000,
                            this.account_name,
                            "error"
                        );
                    }
                } else {
                    await logDelay(
                        `🎯 Trò chơi: Không thể nhận dữ liệu trò chơi`,
                        3000,
                        this.account_name,
                        "error"
                    );
                }
            } else {
                await logDelay(
                    `🎯 Trò chơi: Không thể bắt đầu trò chơi`,
                    1000,
                    this.account_name,
                    "error"
                );
            }
        }
    }

    async startGame() {
        try {
            const url = `${this.base_url}/friendly/growth-paas/mini-app-activity/third-party/game/start`;
            const gameResponse = await this.fetch(url, "POST", this.access_token, {
                resourceId: 2056,
            });

            this.game_response = gameResponse;

            if (gameResponse.code !== "000000") {
                await logDelay(
                    `🎯 Trò chơi: Trò chơi bắt đầu thất bại ${gameResponse.message}`,
                    1000,
                    this.account_name,
                    "error"
                );
                return false;
            } else {
                await logDelay(
                    `🎯 Trò chơi: Trò chơi bắt đầu`,
                    1000,
                    this.account_name,
                    "info"
                );

                // await identifyTrapItems(gameResponse.cryptoMinerConfig || {});
                return true;
            }
        } catch (error) {
            log(`🎯 Game: Error ${error.message}`, "error");
            return false;
        }
    }


    //! Not Used
    async gameData() {
        const url =
            "https://moonbix-server-9r08ifrt4-scriptvips-projects.vercel.app/moonbix/api/v1/play";
        const payload = { game_response: this.game_response };

        try {
            const response = await axios.get(url, {
                params: payload, // Sử dụng thông số để gửi dữ liệu truy vấn
                proxy: false, // Kiểm tra xem proxy đã đầy hay chưa
                timeout: 20000, // Thời gian chờ được đặt thành 20 giây (20.000 ms)
            });

            const data = response.data;

            if (data.message === "success") {
                const point = data.game.log;
                this.game_data = data.game;

                await logDelay(
                    `🎯 Game: Received points ${point}`,
                    1000,
                    this.account_name,
                    "success"
                );
                return true;
            } else {
                await logDelay(
                    `🎯 Game: Lỗi nhận dữ liệu game ${data.message}`,
                    3000,
                    this.account_name,
                    "error"
                );
                return false;
            }
        } catch (error) {
            await logDelay(
                `🎯 Game: Lỗi nhận dữ liệu game ${error.message}`,
                3000,
                this.account_name,
                "error"
            );
            return false;
        }
    }

    async completeGame(payload, score) {
        try {
            const url = `${this.base_url}/friendly/growth-paas/mini-app-activity/third-party/game/complete`;
            const body = {
                resourceId: 2056,
                payload: payload,
                log: score
            }
            const data = await this.fetch(url, "POST", this.access_token, body);

            if (data.code === "000000" && data.success) {
                await logDelay(`🎯 Trò chơi: Trò chơi đã hoàn thành | Đã nhận được ${score} điểm`, 1000, this.account_name, 'custom');
                return true;
            } else {
                return false;
            }
        } catch (error) {
            await logDelay(`🎯 Trò chơi: Lỗi khi hoàn thành trò chơi ${error.message}`, 1000, this.account_name, 'error');
            return false
        }
    }

    async retryApiCall(apiCall, retries = 3, delayTime = 1000, accountName = '') {
        let attempt = 0;

        while (attempt < retries) {
            try {
                return await apiCall();
            } catch (error) {
                if (error.includes('504') || error.includes('502')) {
                    attempt++;
                    await logDelay(
                        `🤖 Cuộc gọi API không thành công: ${error}, retrying... (${attempt}/${retries})`,
                        delayTime,
                        accountName,
                        'error'
                    );
                    await delay(delayTime);
                } else {
                    throw error;
                }
            }
        }

        throw new Error(`🤖 Cuộc gọi API không thành công sau lần thử ${retries}.`);
    }

}