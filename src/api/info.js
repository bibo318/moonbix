import { API } from "./api.js";
import { logDelay } from "../config/helpers.js";

export class Moonbix extends API {
    constructor(name, query, proxy) {
        super(proxy)

        this.proxy = proxy;
        this.query = query
        this.account_name = name
        this.access_token = null
        this.account_info = null
        this.current_session = null
        this.game_response = null
        this.game_data = null
        this.game_ticket = null
        this.game_traps = []
        this.game_refresh_ticket = {
            message: null,
            time: 0,
            date: null
        }
        this.base_url = 'https://www.binance.com/bapi/growth/v1'
    }

    async getAccessToken() {
        return new Promise(async(resolve, reject) => {
            try {
                await logDelay(`🗝️ Xác thực: Hãy thử đăng nhập`, 1000, this.account_name, 'info');
                const accessTokenUrl = `${this.base_url}/friendly/growth-paas/third-party/access/accessToken`;

                const data = await this.fetch(
                    accessTokenUrl,
                    "POST",
                    null, { queryString: this.query, socialType: 'telegram' }
                );

                if (data.ok === false) {
                    throw new Error(`🤖 Không nhận được mã thông báo truy cập: ${data.statusText}`);
                }

                if (data.code !== '000000' || !data.success) {
                    throw new Error(`🤖 Không nhận được mã thông báo truy cập: ${data.message}`);
                }

                //* Get access token from the data
                const accessToken = data.data.accessToken;

                this.access_token = accessToken

                resolve();
            } catch (error) {
                reject(`🤖 Cuộc gọi API không thành công: ${error}`);
            }
        });
    }

    async getUserInfo(with_msg = false) {
        return new Promise(async(resolve, reject) => {
            try {

                if (with_msg) {
                    await logDelay(`🗝️ Auth: Lấy thông tin người dùng`, 1000, this.account_name, 'info');
                }
                const userInfoUrl = `${this.base_url}/friendly/growth-paas/mini-app-activity/third-party/user/user-info`;

                const data = await this.fetch(
                    userInfoUrl,
                    "POST",
                    this.access_token, { resourceId: 2056 }
                );

                if (data.code !== '000000' || !data.success) {
                    throw new Error(`🤖 Không lấy được thông tin người dùng: ${data.message}`);
                }

                this.account_info = data.data

                const metaInfo = data.data.metaInfo
                const availableTickets = (metaInfo.totalAttempts || 0) - (metaInfo.consumedAttempts || 0)
                const refreshTicket = metaInfo.attemptRefreshCountDownTime || 0
                    //? 10 phút
                const refreshOneTicket = 10 * 60 * 1000
                const min_ticket_play = 3
                const attemptTime = refreshTicket + (refreshOneTicket * min_ticket_play - availableTickets)
                const formatRefreshTicket = refreshTicket != 0 ? this.formatTimeFromNow(attemptTime) : "N/A"
                let refreshTicketDate = null

                if (refreshTicket != 0) {
                    refreshTicketDate = this.formatDateTimeFromNow(attemptTime)
                }

                this.game_refresh_ticket = {
                    message: formatRefreshTicket,
                    time: attemptTime,
                    date: refreshTicketDate
                }
                this.game_ticket = availableTickets

                if (with_msg) {
                    await logDelay(`🪙 Balance: ${metaInfo.totalGrade}`, 500, this.account_name, 'success');
                    await logDelay(`🃏 Tickets Có sẵn: ${availableTickets}/6`, 500, this.account_name, 'success');
                }

                resolve();
            } catch (error) {
                reject(`🤖 Cuộc gọi API không thành công: ${error}`);
            }
        });
    }

    formatTimeFromNow(milliseconds) {
        const now = new Date().getTime();
        const futureTime = new Date(now + milliseconds);

        const diffInSeconds = Math.floor((futureTime - now) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);

        if (diffInMinutes < 1) {
            return `${diffInSeconds} seconds`;
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} minutes`;
        } else {
            return `${diffInHours} hours`;
        }
    }

    formatDateTimeFromNow(future_ms) {
        const now = new Date();
        const futureTime = new Date(now.getTime() + future_ms);

        const day = String(futureTime.getDate()).padStart(2, '0');
        const month = String(futureTime.getMonth() + 1).padStart(2, '0'); //Vì tháng bắt đầu từ 0
        const year = futureTime.getFullYear();

        const hours = String(futureTime.getHours()).padStart(2, '0');
        const minutes = String(futureTime.getMinutes()).padStart(2, '0');

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }
}