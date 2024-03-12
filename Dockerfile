FROM public.ecr.aws/lambda/nodejs:18.2024.03.04.09-x86_64 as builder

WORKDIR /usr/app/

COPY package.json ./

RUN npm install

COPY ./src ./src

RUN npm run build


FROM public.ecr.aws/lambda/nodejs:18.2024.03.04.09-x86_64

WORKDIR ${LAMBDA_TASK_ROOT}
RUN yum update -y
RUN set -x && \
    yum install -y python3-pip
COPY --from=builder ./usr/app/src/scripts/* ./scripts
RUN pip3 install maturin
RUN pip3 install -r ./scripts/requirements.txt



COPY --from=builder /usr/app/dist/* ./
CMD ["index.handler"]